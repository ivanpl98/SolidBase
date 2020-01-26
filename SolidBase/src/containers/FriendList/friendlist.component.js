import React from 'react';
//import { CenterContainer } from '@util-components';
//import { ProviderLogin, withWebId } from '@inrupt/solid-react-components';
import {List, Image,Value,useLDflexList,useLDflexValue, useWebId,  Name} from '@solid/react';
import {lib} from '@solid/query-ldflex';
import {ImageProfile} from '/components/ImageProfile/image-profile.component';
import data from "@solid/query-ldflex";
const $rdf = require('rdflib');

function friends() {
  /*let friends   = solid.data[useWebId()].friends
  const doc   = solid.data['https://jeffz.solid.community/public/ldflex.ttl']
  console.log(Name(friends))*/
  const friends = useLDflexList('user.friends');
  let size = friends.size

        // the raw default JSON-LD context


  return friends
}
function viewProfile(profile) {
  window.open(profile)
 }
function deletefriend(profile) {
  if (window.confirm("Do you really want to delete "+profile+" from your friends?")) {
      let FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/'); // n0

      let insertions = [];
      let deletions = [];
      let docs = "https://astrid.solid.community/profile/card#me";
      console.log(docs.split('#')[0]+ ":" + docs.toString())
      const doc = $rdf.sym(docs);
      let subject = $rdf.sym(docs.toString());

      let predicate = $rdf.sym(FOAF('knows'));
      let object = $rdf.sym(profile);
      let statement = $rdf.st(subject, predicate, object, doc);
      insertions.push(statement);
      $rdf.addfriend(docs);
    }
  }
  function webid() {
    const user = useLDflexValue('user') || 'unknown';
    return user;
  }
function friendlist() {
  const name = useLDflexValue('user.name') || 'unknown';

  const friends = useLDflexList('user.friends');

  /*let fmap = friends.map(function(friend) {
    let url = <a href={friend.toString()}>{friend.toString()} </a>
    return   url
  })*/
   return <p> {name.toString()} friends  are:    </p>
}
function  proimage() {
  const img = useLDflexValue('user.image');
return img + "";
}
function profilephoto( ) {

    // We are fetching profile card document
    const { user } = data;
    const image = user.friends;
    return image  + '';

}
const FriendListComponent = () => {
  return (<p>
       This is {[useWebId()]} a list of friends {friendlist()}

      <List src={friends()}>{friend =>
        <li key={friend}>
          <button onClick={() => viewProfile(friend.toString())}>
            <Value src={`[${friend}].name`}> {`${friend}`}</Value>
          </button>

          <button onClick={() => deletefriend(friend)}>
            <Value src={`[${friend}].email`}>  Delete Friend</Value>
          </button>

        </li>}
      </List>

      <ImageProfile/>

    </p>
  );

}
export default FriendListComponent;

