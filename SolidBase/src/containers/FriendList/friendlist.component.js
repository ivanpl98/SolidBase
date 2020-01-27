import React, { useState } from "react";
import { RdfService } from "@services";
import auth from "solid-auth-client";
import * as rdf from "rdflib";

//import { CenterContainer } from '@util-components';
//import { ProviderLogin, withWebId } from '@inrupt/solid-react-components';

import {
  List,
  Value,
  useLDflexList,
  useLDflexValue,
  useWebId,
  Name
} from "@solid/react";
import { solid } from "@solid/query-ldflex";
import { rdfService } from "@services";
import {FriendListItem} from "@components";

async function getFriends() {
  let friends = await rdfService.getContacts();
  console.log(friends);
  return friends;
}
function viewProfile(profile) {
  window.open(profile);
}
function friendlist() {
  const name = useLDflexValue("user.name") || "unknown";

  const friends = useLDflexList("user.friends");

  let fmap = friends.map(function(friend) {
    let url = <a href={friend.toString()}>{friend.toString()} </a>;
    return url;
  });
  return <p> {name.toString()} friends are: </p>;
}

export default class FriendListComponent extends React.Component {
  constructor() {
    super();
    this.state = {
      friends: [],
      user: ""
    };
  }

  async componentDidMount() {
    const frs = await getFriends();
    const us = await rdfService.getWebId();
    console.log(frs);
    this.setState({ friends: frs, user: us });
  }

  render() {
    console.log(this.state.friends);
    const friendsList = (
      <div>
        {this.state.friends.map(friend => {
          return <FriendListItem user = {friend.value}></FriendListItem>;
        })}
        ;
      </div>
    );
    return (
      <div>
        <p>This is the friend list of {this.state.user}:</p>
        {friendsList}
      </div>
    );
  }
} /*}
      </ul>
    </div>
  );
}; 
export default FriendListComponent;
*/

/* const FriendListComponent = async () => {
  let friends = await getFriends();
  const [friendsList, setfriendsList] = useState(friends);
  console.log(friendsList);

  return (
    <div>
      <p>This is {[useWebId()]} a list of friends</p>
      <ul>
        {/*         {friendsList.map(friend => {
          return (
            <li>
              <a href={friend.toString()}>{friend.toString()} </a>
            </li>
          );
        })} */
