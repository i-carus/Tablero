using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using Microsoft.SqlServer.Server;

namespace Tablero.Common
{
    public class TableroHub : Hub
    {

        private static ConcurrentDictionary<string,string> groups = new  ConcurrentDictionary<string, string>();

        public override Task OnConnected()
        {

            if (Context.RequestCookies.ContainsKey("name"))
            {
                AddUserToList(null,Context.RequestCookies["name"]);
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

        public void GetConnectedUsers(string name)
        {
            if(!Context.RequestCookies.ContainsKey("name"))
                AddUserToList(name,null);//To account for mobile devices that don't send the cookies on the request
            BroadcastListOfUsers();
            
        }


        public void Reset()
        {
            string sender = (from item in groups where item.Value == this.Context.ConnectionId select item.Key).FirstOrDefault();
            Clients.Others.reset(sender);
        }

        public void Draw(Shape s)
        {
            string sender = (from item in groups where item.Value == this.Context.ConnectionId select item.Key).FirstOrDefault();

            Clients.Others.draw(s,sender);
        }

        public void ChangeColor(string color)
        {
            Clients.Others.changeColor(color);
        }

        //public void StreamImage(string base64Image)
        //{
        //    Clients.Others.streamImage(base64Image);
        //}
        
        /// <summary>
        /// Utility methods       
        /// </summary>
 
        
        private void BroadcastListOfUsers()
        {
            var users = (from c in groups
                select new {user = c.Key, connection_id = c.Value}).ToList();
            Clients.All.ListConnectedUsers(users);
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
    }
}