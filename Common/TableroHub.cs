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

        public void Draw(List<Point> coords, int lineWidth)
        {
            string sender = (from item in groups where item.Value == this.Context.ConnectionId select item.Key).FirstOrDefault();

            Clients.Others.draw(coords, lineWidth, sender);
        }

        public void ChangeColor(string color)
        {
            Clients.Others.changeColor(color);
        }

        /// <summary>
        /// Utility methods
        /// </summary>
        private void BroadcastListOfUsers()
        {
            var users = (from c in groups
                select new {user = c.Key, connection_id = c.Value}).ToList();
            Clients.All.ListConnectedUsers(users);
        }

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