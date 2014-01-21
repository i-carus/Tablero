using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
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
            string name = Context.RequestCookies.ContainsKey("name")
                ? Context.RequestCookies["name"].Value
                : "NOT_FOUND";
            if(name!="NOT_FOUND")
               groups.AddOrUpdate(name, this.Context.ConnectionId, (key, value) => { return Context.ConnectionId; });
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
            if (name != null)
            {
                this.Groups.Add( name,this.Context.ConnectionId);
                groups.AddOrUpdate(name,this.Context.ConnectionId, (key, value) => { return Context.ConnectionId; });
            }
            Clients.All.ListConnectedUsers(groups.Keys.ToList());
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
           
            Clients.All.ListConnectedUsers(groups.Keys.ToList());
        }
    }
}