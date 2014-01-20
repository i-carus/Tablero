using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
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

            groups.AddOrUpdate(name, this.Context.ConnectionId, (key, value) => { return Context.ConnectionId; });
            return base.OnConnected();
        }

        public override Task OnDisconnected()
        {
            BroadcastListOfUsers();
            return base.OnDisconnected();
        }

        public override Task OnReconnected()
        {
            BroadcastListOfUsers();
            return base.OnReconnected();
        }

        private void BroadcastListOfUsers()
        {
            string key = "";
            foreach (var item in groups)
            {
                if (item.Value == this.Context.ConnectionId)
                {
                    key = item.Key;
                    break;
                }
            }
            string connID = null;
            groups.TryRemove(key, out connID);
            Clients.All.ListConnectedUsers(groups.Keys.ToList());
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

        public void Hello(string something)
        {
            Clients.All.hello(something + " coming from the server!");
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
    }
}