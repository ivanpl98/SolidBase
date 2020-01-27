import React,{Component} from 'react';
import {rdfService} from '@services';

export default class FriendListItem extends Component{   
    constructor(props){
        super(props);
        this.state={
            user: props.user,
            data: []
        };
    }

    async componentDidMount(){
        console.log(this.state.user);
        const friendData = await rdfService.getFriendData(this.state.user);
        console.log(friendData);
        this.setState({data: friendData});
    }
/* jshint ignore:start */
    render(){
        return (
        <a href={this.state.user}>
            <div>
                <p>{this.state.data.fn || this.state.user}</p>
                <img src={this.state.data.image}/>
            </div>
        </a>
        )
    }
/* jshint ignore:end */
}