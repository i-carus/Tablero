using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin.Security.Provider;
using Microsoft.SqlServer.Server;
using Newtonsoft.Json;
using Tablero.Models;
using Cookie = Microsoft.AspNet.SignalR.Cookie;

namespace Tablero.Common
{
    public class TableroHub : Hub
    {

        private static ConcurrentDictionary<string,string> groups = new  ConcurrentDictionary<string, string>();
        private static ConcurrentDictionary<string,string> videoConfs = new ConcurrentDictionary<string, string>(); 
        #region connection_events
        public override Task OnConnected()
        {

            if (Context.RequestCookies.ContainsKey("name"))
            {
                AddUserToList(null, Context.RequestCookies["name"]);
            }
            return base.OnConnected();
        }

        public override Task OnDisconnected()
        {
            var values = groups.Values.Where(x => x == this.Context.ConnectionId).ToList();
            List<string> keys = new List<string>();
            foreach (var item in groups)
            {
                if (item.Value == this.Context.ConnectionId)
                {
                    keys.Add(item.Key);
                }
            }
            foreach (var key in keys)
            {
                string connID;
                groups.TryRemove(key, out connID);
            }

            BroadcastListOfUsers();
            return base.OnDisconnected();
        }

        public override Task OnReconnected()
        {
            BroadcastListOfUsers();
            return base.OnReconnected();
        }
        #endregion
      
        #region WebRTC_stuff

        /// <summary>
        /// When an RTCPeerConnection is created, the caller calls this method to send the initial offer to the
        /// other party
        /// </summary>
        /// <param name="message">The SDP message in JSON format</param>
        /// <param name="otherPeer">Name of the person (not the connection id) that will receive the offer to establish the connection</param>
        public void SendOffer(string message, string otherPeer)
        {
            string recipient = null;
            string sender = GetSenderNameFromConnectionId();

            if (groups.TryGetValue(otherPeer.Trim(), out recipient))
            {
                Clients.Client(recipient).acceptOffer(message, sender);
                videoConfs.AddOrUpdate(sender.Trim(), otherPeer.Trim(), (key, value) => otherPeer.Trim());
            }
            
        }

        /// <summary>
        /// After an RTCPeerConnection is created, a list of IceCandidate(s) are created. 
        /// The peer that initiates the connection, will fire a series of RTCPeerConnection.onicecandidate events. 
        /// These candidates generated on this event need to be send over to the other peer (the person receiving the call).
        /// BUT CAREFUL: the IceCandidate(s) should NOT be assigned until the RTCPeerConnection.setRemoteDescription method
        /// has been called on each peer but since the candidates are generated way before you get a chance to set the remote description
        /// one needs to put these candidates in a JavaScript array until after setRemoteDescription is called.
        /// </summary>
        /// <param name="message">The IceCandidate in JSON format</param>
        /// <param name="otherPeer">The name (not the connection id) of the peer receiving the candidate.</param>
        public void SendCandidate(string message, string otherPeer)
        {
            string recipient = null;

            if (groups.TryGetValue(otherPeer.Trim(), out  recipient))
                Clients.Client(recipient).receiveCandidate(message);
        }

        /// <summary>
        /// Once the callee receives the offer and sets it's RemoteDescription, it needs to send an "Answer" (an object identical to the Offer, really)
        /// except that it's "type" property is "answer" instead of "offer". The Caller takes the answer and sets it as its own RemoteDescription.
        /// In order to pass this answer (Offer) back to the caller, we call the acceptAnswer method on the client side.
        /// </summary>
        /// <param name="message">The SDP (Session Description Protocol) (answer) in JSON format</param>
        /// <param name="otherPeer"></param>
        public void SendAnswer(string message, string otherPeer)
        {
            string recipient = null;

            if (groups.TryGetValue(otherPeer.Trim(), out  recipient))
                Clients.Client(recipient).acceptAnswer(message);
        }

        //Instructs the user doing video conferencing with the sender to hang up the call.
        public void HangUp()
        {
            string sender = GetSenderNameFromConnectionId();
            string otherEnd = "";

            this.Clients.Caller.newTurns(GetNewTurns());
            if (videoConfs.TryRemove(sender, out otherEnd))
            {
                Clients.Client(groups[otherEnd.Trim()]).hangUp();
                Clients.Client(groups[otherEnd.Trim()]).newTurns(GetNewTurns());
            }
            else
            {
                //try finding by value
                var otherPeer= videoConfs.FirstOrDefault(x => x.Value == sender);
                Clients.Client(groups[otherPeer.Key.Trim()]).hangUp();
                Clients.Client(groups[otherPeer.Key.Trim()]).newTurns(GetNewTurns());
                videoConfs.TryRemove(otherPeer.Key, out otherEnd);
            }

        }
        #endregion

        #region Tablero-related methods
        
        /// <summary>
        /// Sends a message to clear the blackboard
        /// </summary>
        public void Reset()
        {
            string sender = GetSenderNameFromConnectionId();
            Clients.Others.reset(sender);
        }

        /// <summary>
        /// Sends a Shape object to the clients to instruct their blackboards to draw the Shape sent.
        /// </summary>
        /// <param name="s"></param>
        public void Draw(Shape s)
        {
            string sender = GetSenderNameFromConnectionId();

            Clients.Others.draw(s, sender);
        }

        /// <summary>
        /// Method to change the line color on all the blackboards.
        /// </summary>
        /// <param name="color"></param>
        public void ChangeColor(string color)
        {
            Clients.Others.changeColor(color);
        }
        #endregion

        #region utility methods

        /// <summary>
        /// This method is called as soon as a user establishes a connection.
        /// We don't do it from the OnConnectedEvent simply because we need to establish the user's name,
        /// which is obtained AFTER the connection is established
        /// </summary>
        /// <param name="name"></param>
        public void GetConnectedUsers(string name)
        {
            if (name!=null)
                name = name.Trim();
            if (!Context.RequestCookies.ContainsKey("name"))
                AddUserToList(name, null);//To account for mobile devices that don't send the cookies on the request
            BroadcastListOfUsers();
        }
        
        
        /// <summary>
        /// Broadcasts the list of all connected users
        /// </summary>
        private void BroadcastListOfUsers()
        {
            var users = (from c in groups
                         select new { user = c.Key, connection_id = c.Value }).ToList();
            Clients.All.ListConnectedUsers(users);
        }

        /// <summary>
        /// Returns the name associated to this user, using it's ConnectionID
        /// </summary>
        /// <returns></returns>
        private string GetSenderNameFromConnectionId()
        {
            string result = (from item in groups where item.Value == this.Context.ConnectionId select item.Key).FirstOrDefault();
            if (result != null)
                result = result.Trim();
            return result;

        }

        /// <summary>
        /// Adds the user to the groups Dictionary. 
        /// Some mobile browsers don't send Cookies in the request; therefore, this method takes the username passed in from the call to
        /// getConnectedUsers method on the client side, to construct a Cookie and check if it already exists in the dictionary. 
        /// </summary>
        /// <param name="username"></param>
        /// <param name="cookie"></param>
        private void AddUserToList(string username, Cookie cookie)
        {
            
            if (username != null)
            {
                username = username.Trim();
                cookie = new Cookie("name", username);
            }

            if (cookie != null)
            {
                var name = cookie.Value;
                int count = 1;
                while (groups.ContainsKey(name))
                    name = name.Substring(0, name.LastIndexOf('_') > 0 ? name.LastIndexOf('_') : name.Length) +
                           ("_" + count++);
                if (groups.ContainsKey(cookie.Value)) //user already taken
                {
                    if (Context.RequestCookies.ContainsKey("name"))
                        Context.RequestCookies.Remove("name");

                    cookie = new Cookie("name", name);
                    Context.RequestCookies.Add("name", cookie);
                    groups.AddOrUpdate(name, this.Context.ConnectionId, (key, value) => { return Context.ConnectionId; });
                }
                else
                    groups.AddOrUpdate(cookie.Value, this.Context.ConnectionId,
                        (key, value) => { return Context.ConnectionId; });
            }
        }
        /// <summary>
        /// Gets a new list of TURN and STUN servers from turnservers.com
        /// </summary>
        /// <returns></returns>
        private string GetNewTurns()
        {
            var wc = new WebClient();
            var newTurns = wc.DownloadString(string.Format("{0}?key={1}", ConfigurationManager.AppSettings["TURN_Servers_Provider"], ConfigurationManager.AppSettings["SecretAPIKey"]));

            var turnRecords = JsonConvert.DeserializeObject<TurnRecords>(newTurns);

            return turnRecords.BuildJson;
        }

        #endregion
        
    }
}