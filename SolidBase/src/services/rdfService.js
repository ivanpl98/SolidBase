import auth from "solid-auth-client";
import * as rdf from "rdflib";
import toastr from "toastr";

//Declaration of namespaces
const VCARD = rdf.Namespace("http://www.w3.org/2006/vcard/ns#");
const FOAF = rdf.Namespace("http://xmlns.com/foaf/0.1/");
const RDF = rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
const SCHEMA = rdf.Namespace("http://schema.org/");

//declaration of service constants
const fetcherOptions = {};

export const getSession = async () => {
  let session = await auth.currentSession(localStorage);
  return session;
};

//declaration of service variables
let session = getSession();
let updateManager = rdf.UpdateManager;
let fetcher = rdf.Fetcher;
let store = rdf.graph();

fetcher = new rdf.Fetcher(store, fetcherOptions);
updateManager = new rdf.UpdateManager(store);

/**
 * Gets a node that matches the specified pattern using the VCARD onthology
 *
 * any() can take a subject and a predicate to find Any one person identified by the webId
 * that matches against the node/predicated
 *
 * @param {string} node VCARD predicate to apply to the rdf.any()
 * @param {string?} webId The webId URL (e.g. https://yourpod.solid.community/profile/card#me)
 * @return {string} The value of the fetched node or an emtpty string
 * @see https://github.com/solid/solid-tutorial-rdflib.js
 */
export const getValueFromVcard = (node, webId) => {
  return getValueFromNamespace(node, VCARD, webId);
};

/**
 * Gets a node that matches the specified pattern using the FOAF onthology
 * @param {string} node FOAF predicate to apply to the rdf.any()
 * @param {string?} webId The webId URL (e.g. https://yourpod.solid.community/profile/card#me)
 * @return {string} The value of the fetched node or an emtpty string
 */
export const getValueFromFoaf = (node, webId) => {
  return getValueFromNamespace(node, FOAF, webId);
};

/**
 * Gets a node that matches the specified pattern using the LDP onthology
 * @param {string} node LDP predicate to apply to the rdf.any()
 * @param {string?} webId The webId URL (e.g. https://yourpod.solid.community/profile/card#me)
 * @return {string} The value of the fetched node or an emtpty string
 */
export const getValueFromLdp = (node, webId) => {
  return getValueFromNamespace(node, SCHEMA, webId);
};

/**
 * Gets a node that matches the specified pattern using the Schema onthology
 * @param {string} node Schema predicate to apply to the rdf.any()
 * @param {string?} webId The webId URL (e.g. https://yourpod.solid.community/profile/card#me)
 * @return {string} The value of the fetched node or an emtpty string
 */
export const getValueFromSchema = (node, webId) => {
  return getValueFromNamespace(node, SCHEMA, webId);
};

export const transformDataForm = (form, me, doc) => {
  const insertions = [];
  const deletions = [];
  const fields = Object.keys(form.value);
  const oldProfileData =
    JSON.parse(localStorage.getItem("oldProfileData")) || {};

  // We need to split out into three code paths here:
  // 1. There is an old value and a new value. This is the update path
  // 2. There is no old value and a new value. This is the insert path
  // 3. There is an old value and no new value. Ths is the delete path
  // These are separate codepaths because the system needs to know what to do in each case
  fields.map(field => {
    const predicate = VCARD(getFieldName(field));
    const subject = getUriForField(field, me);
    const why = doc;

    const fieldValue = getFieldValue(form, field);
    const oldFieldValue = getOldFieldValue(field, oldProfileData);

    // if there's no existing home phone number or email address, we need to add one, then add the link for hasTelephone or hasEmail
    if (
      !oldFieldValue &&
      fieldValue &&
      (field === "phone" || field === "email")
    ) {
      addNewLinkedField(field, insertions, predicate, fieldValue, why, me);
    } else {
      // Add a value to be updated
      if (
        oldProfileData[field] &&
        form.value[field] &&
        !form.controls[field].pristine
      ) {
        deletions.push(rdf.st(subject, predicate, oldFieldValue, why));
        insertions.push(rdf.st(subject, predicate, fieldValue, why));
      } else if (
        oldProfileData[field] &&
        !form.value[field] &&
        !form.controls[field].pristine
      ) {
        deletions.push(rdf.st(subject, predicate, oldFieldValue, why));
      } else if (
        !oldProfileData[field] &&
        form.value[field] &&
        !form.controls[field].pristine
      ) {
        insertions.push(rdf.st(subject, predicate, fieldValue, why));
      }
    }
  });

  return {
    insertions,
    deletions
  };
};

export const addNewLinkedField = (
  field,
  insertions,
  predicate,
  fieldValue,
  why,
  me
) => {
  // Generate a new ID. This id can be anything but needs to be unique.
  const newId = field + ":" + Date.now();

  // Get a new subject, using the new ID
  const newSubject = rdf.sym(session.webId.split("#")[0] + "#" + newId);

  // Set new predicate, based on email or phone fields
  const newPredicate =
    field === "phone"
      ? rdf.sym(VCARD("hasTelephone"))
      : rdf.sym(VCARD("hasEmail"));

  // Add new phone or email to the pod
  insertions.push(rdf.st(newSubject, predicate, fieldValue, why));

  // Set the type (defaults to Home/Personal for now) and insert it into the pod as well
  // Todo: Make this dynamic
  const type =
    field === "phone" ? rdf.literal("Home") : rdf.literal("Personal");
  insertions.push(rdf.st(newSubject, VCARD("type"), type, why));

  // Add a link in #me to the email/phone number (by id)
  insertions.push(rdf.st(me, newPredicate, newSubject, why));
};

export const getUriForField = (field, me) => {
  let uriString;
  let uri;

  switch (field) {
    case "phone":
      uriString = getValueFromVcard("hasTelephone");
      if (uriString) {
        uri = rdf.sym(uriString);
      }
      break;
    case "email":
      uriString = getValueFromVcard("hasEmail");
      if (uriString) {
        uri = rdf.sym(uriString);
      }
      break;
    default:
      uri = me;
      break;
  }
  return uri;
};

/**
 * Extracts the value of a field of a NgForm and converts it to a rdf.NamedNode
 * @param {string} field The name of the field that is going to be extracted from the form
 * @return {RdfNamedNode}
 */
export const getFieldValue = (form, field) => {
  let fieldValue;

  if (!form.value[field]) {
    return;
  }

  switch (field) {
    case "phone":
      fieldValue = rdf.sym("tel:+" + form.value[field]);
      break;
    case "email":
      fieldValue = rdf.sym("mailto:" + form.value[field]);
      break;
    default:
      fieldValue = form.value[field];
      break;
  }

  return fieldValue;
};

export const getOldFieldValue = (field, oldProfile) => {
  let oldValue;

  if (!oldProfile || !oldProfile[field]) {
    return;
  }

  switch (field) {
    case "phone":
      oldValue = rdf.sym("tel:+" + oldProfile[field]);
      break;
    case "email":
      oldValue = rdf.sym("mailto:" + oldProfile[field]);
      break;
    default:
      oldValue = oldProfile[field];
      break;
  }

  return oldValue;
};

export const getFieldName = field => {
  switch (field) {
    case "company":
      return "organization-name";
    case "phone":
    case "email":
      return "value";
    default:
      return field;
  }
};

export const updateProfile = async form => {
  const me = rdf.sym(session.webId);
  const doc = rdf.NamedNode.fromValue(session.webId.split("#")[0]);
  const data = transformDataForm(form, me, doc);

  // Update existing values
  if (data.insertions.length > 0 || data.deletions.length > 0) {
    updateManager.update(
      data.deletions,
      data.insertions,
      (response, success, message) => {
        if (success) {
          toastr.success(
            "Your Solid profile has been successfully updated",
            "Success!"
          );
          form.form.markAsPristine();
          form.form.markAsTouched();
        } else {
          toastr.error("Message: " + message, "An error has occurred");
        }
      }
    );
  }
};

export const getAddress = () => {
  const linkedUri = getValueFromVcard("hasAddress");

  if (linkedUri) {
    return {
      locality: getValueFromVcard("locality", linkedUri),
      country_name: getValueFromVcard("country-name", linkedUri),
      region: getValueFromVcard("region", linkedUri),
      street: getValueFromVcard("street-address", linkedUri)
    };
  }

  return {};
};

// Function to get email. This returns only the first email, which is temporary
export const getEmail = () => {
  const linkedUri = getValueFromVcard("hasEmail");

  if (linkedUri) {
    return getValueFromVcard("value", linkedUri).split("mailto:")[1];
  }

  return "";
};

// Function to get phone number. This returns only the first phone number, which is temporary. It also ignores the type.
export const getPhone = () => {
  const linkedUri = getValueFromVcard("hasTelephone");

  if (linkedUri) {
    return getValueFromVcard("value", linkedUri).split("tel:+")[1];
  }
};

export const getProfile = async () => {
  if (!session) {
    await getSession();
  }
  console.log("Wait for it...");
  if (session === null) {
    console.log("NULL SESSION!!!");
  }

  try {
    await fetcher.load(session.webId);

    console.log("Profile loaded: " + getProfileField("fn"));
    return {
      fn: await getProfileField("fn"),
      company: await getProfileField("organization-name"),
      phone: getPhone(),
      role: await getProfileField("role"),
      image: await getProfileField("hasPhoto"),
      address: getAddress(),
      email: getEmail()
    };
  } catch (error) {
    console.log(`Error fetching data: ${error}`);
  }
};

/**
 * Gets any resource that matches the node, using the provided Namespace
 * @param {string} node The name of the predicate to be applied using the provided Namespace
 * @param {rdf.namespace} namespace The RDF Namespace
 * @param {string?} webId The webId URL (e.g. https://yourpod.solid.community/profile/card#me)
 */
export const getValueFromNamespace = (node, namespace, webId) => {
  const st = store.any(rdf.sym(webId || session.webId), namespace(node));
  if (st) {
    return store.value;
  }
  return "";
};

// * * * * * * * * * * * * * * * * * * * * * //
// Our methods go down here :D
//
//  |   |   |   |   |   |   |
//  v   v   v   v   v   v   v

export const getProfileField = async field => {
  return await getField(session.webId, field, VCARD);
};

/**
 * This method is used for retrieving the value of a field as an string.
 * @param webId WebId of the resource from where the field is going to be retrieved.
 * @param field Field to retrieve from the resource.
 * @param namespace Namespace to which the field belongs.
 */
export const getField = async (webId, field, namespace) => {
  try {
    let id = await store.sym(webId);
    await fetcher.load(id.doc(), {
      force: true,
      clearPreviousData: true
    });
    let element = store.any(id, namespace(field));
    if (element !== undefined) {
      return element.value;
    } else {
      return element;
    }
  } catch (err) {
    console.log(`Error while fetching data ${err}`);
  }
};

/**
 * This method is used for retrieving data as an array.
 * @param webId WebId from  which the data is going to be retrieved.
 * @param field Field that is going to be retrieved from the resource.
 * @param namespace Name space to which the field belongs.
 */
export const getFieldArray = async (webId, field, namespace) => {
  try {
    const id = await store.sym(webId);
    await fetcher.load(id.doc(), {
      force: true,
      clearPreviousData: true
    });
    return store.each(id, namespace(field));
  } catch (err) {
    console.log(`Error while fetching data:  ${err}`);
  }
};

export const getFriendData = async webId => {
  try {
    console.log("Profile loaded: " + (await getField(webId, "fn", VCARD)));
    return {
      fn: await getField(webId, "fn", VCARD),
      company: await getField(webId, "organization-name", VCARD),
      phone: await getFriendPhone(webId),
      role: await getField(webId, "role", VCARD),
      image: await getField(webId, "hasPhoto", VCARD),
      address: await getFriendAddress(webId),
      email: await getFriendEmail(webId)
    };
  } catch (error) {
    console.log(`Error fetching data: ${error}`);
  }
};

export const getChatData = async chatUrl => {
  try {
    console.log("Chat loaded: " + (await getField(chatUrl, "name", SCHEMA)));
    return {
      id: await getField(chatUrl, "identifier", SCHEMA),
      name: await getField(chatUrl, "name", SCHEMA),
      administrators: await getFieldArray(chatUrl, "author", SCHEMA),
      users: await getFieldArray(chatUrl, "contributor", SCHEMA),
      picture: await getField(chatUrl, "image", SCHEMA)
    };
  } catch (error) {
    console.log(`Error fetching data : ${error}`);
  }
};

export const getMessageData = async messageUrl => {
  try {
    const identifier = await getField(messageUrl, "identifier", SCHEMA);
    console.log(`Message loaded: ${identifier}`);
    return {
      id: identifier.split("/")[2],
      chatId: identifier.split("/")[0],
      bundleId: identifier.split("/")[1],
      message: await getField(messageUrl, "text", SCHEMA),
      sender: await getField(messageUrl, "sender", SCHEMA),
      date: await getField(messageUrl, "dateSent", SCHEMA)
    };
  } catch (error) {
    console.log(`Error fetching data: ${error}`);
  }
};

export const requestIsCha = async webId => {
  try {
    const file = await getFieldArray(webId, "type", RDF);
    return file.includes(SCHEMA("Conversation"));
  } catch (err) {
    console.log(`Error while fetching data ${err}`);
  }
};

// Function to get email. This returns only the first email, which is temporary
export const getFriendEmail = async webId => {
  const linkedUri = await getField(webId, "hasEmail", VCARD);

  if (linkedUri) {
    const mail = await getField(linkedUri, "value", VCARD);
    return mail.split("mailto:")[1];
  }

  return "";
};

// Function to get phone number. This returns only the first phone number, which is temporary. It also ignores the type.
export const getFriendPhone = async webId => {
  const linkedUri = await getField(webId, "hasTelephone", VCARD);

  if (linkedUri) {
    const mail = await getField(linkedUri, "value", VCARD);
    const phone = mail.split("tel:")[1];
    return phone;
  }

  return "";
};

export const getFriendAddress = async webId => {
  const linkedUri = await getField(webId, "hasAddress", VCARD);

  if (linkedUri) {
    return {
      locality: await getField(linkedUri, "locality", VCARD),
      country_name: await getField(linkedUri, "country-name", VCARD),
      region: await getField(linkedUri, "region", VCARD),
      street: await getField(linkedUri, "street-address", VCARD)
    };
  }

  return {};
};

/**
 * This method is used for adding a new friend from your solid profile
 * @param webId WebId of the friend to add.
 */
export const addFriend = webId => {
  const me = rdf.sym(session.webId);
  const friend = rdf.sym(webId);
  const toBeInserted = rdf.st(me, FOAF("knows"), friend, me.doc());
  updateManager.update([], toBeInserted, (response, success, message) => {
    if (success) {
      toastr.success("Friend added", "Success!");
    } else {
      toastr.error("Message: " + message, "An error has occurred");
    }
  });
};

/**
 * This method is used to remove a friend from your solid profile.
 * @param webId webId of the friend to remove
 */
export const removeFriend = webId => {
  const me = rdf.sym(session.webId);
  const friend = rdf.sym(webId);
  const toBeInserted = rdf.st(me, FOAF("knows"), friend, me.doc());
  updateManager.update(toBeInserted, [], (response, success, message) => {
    if (success) {
      toastr.success("Friend removed", "Success!");
    } else {
      toastr.error("Message: " + message, "An error has occurred");
    }
  });
};

export const getContacts = async () => {
  let webId = await getWebId();
  let contacts = await getFieldArray(webId, "knows", FOAF);
  return contacts;
};

export const getWebId = async () => {
  let session = await getSession();
  let webId = session.webId;
  console.log(webId);
  return webId;
};

export const getUserName = async () => {
  let webId = await getWebId();
  return getField(webId, "fn", VCARD);
};

export const getProfilePicture = async () => {
  let webId = await getWebId();
  return getField(webId, "hasPhoto", VCARD);
};
