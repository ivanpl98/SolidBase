import React from 'react';
//import { CenterContainer } from '@util-components';
//import { ProviderLogin, withWebId } from '@inrupt/solid-react-components';
import {List,Value,useLDflexList,useLDflexValue, useWebId,  Name} from '@solid/react';
import {solid} from '@solid/query-ldflex';

function friends() {
  /*let friends   = solid.data[useWebId()].friends
  const doc   = solid.data['https://jeffz.solid.community/public/ldflex.ttl']
  console.log(Name(friends))*/
  const friends = useLDflexList('user.friends');
  let size = friends.size
  return friends
}
function viewProfile(profile) {
  window.open(profile)
 }
function friendlist() {
  const name = useLDflexValue('user.name') || 'unknown';

  const friends = useLDflexList('user.friends');

   let fmap = friends.map(function(friend) {
    let url = <a href={friend.toString()}>{friend.toString()} </a>
    return   url
  })
   return <p> {name.toString()} friends  are:    </p>
}


const FriendListComponent = () => {
  return (<p>
       This is {[useWebId()]} a list of friends {friendlist()}


      <List src={friends()}>{friend =>
        <li key={friend}>
          <button onClick={() => viewProfile(friend.toString())}>
            <Value src={`[${friend}].name`}> {`${friend}`}</Value>
          </button>
        </li>}
      </List>
  </p>
  );

}
export default FriendListComponent;

