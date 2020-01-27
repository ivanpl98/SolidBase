import React, { useState } from "react";
import { RdfService } from "@services";
import auth from "solid-auth-client";
import * as rdf from "rdflib";
import {List, Image,Value,useLDflexList,useLDflexValue, useWebId,  Name} from '@solid/react';
import {lib} from '@solid/query-ldflex';
import {ImageProfile} from '/components/ImageProfile/image-profile.component';
import data from "@solid/query-ldflex";
const $rdf = require('rdflib');
import { solid } from "@solid/query-ldflex";
import { rdfService } from "@services";
import {FriendListItem} from "@components";

//import { CenterContainer } from '@util-components';
//import { ProviderLogin, withWebId } from '@inrupt/solid-react-components';

async function getFriends() {
  let friends = await rdfService.getContacts();
  console.log(friends);
  return friends;
}
function viewProfile(profile) {
  window.open(profile);
}

function friends() {
  /*let friends   = solid.data[useWebId()].friends
  const doc   = solid.data['https://jeffz.solid.community/public/ldflex.ttl']
  console.log(Name(friends))*/
  const friends = useLDflexList('user.friends');
  let size = friends.size

        // the raw default JSON-LD context


  return friends
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
  const name = useLDflexValue("user.name") || "unknown";

  const friends = useLDflexList("user.friends");

}
function  proimage() {
  const img = useLDflexValue('user.image');
return img + "";
}
function profilephoto( ) {

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
          return (
         <FriendListItem user = {friend.value}></FriendListItem>
         <button onClick={() => deletefriend(friend.value)}>
            <Value src={friend.value}>  Delete Friend</Value>
          </button>
        );
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
} 


