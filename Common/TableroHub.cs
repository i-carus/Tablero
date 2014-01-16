using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace Tablero.Common
{
    public class TableroHub : Hub
    {
        public void Hello(string something)
        {
            Clients.All.hello(something + " coming from the server!");
        }

        public void Reset()
        {
            Clients.Others.reset();
        }

        public void StartPaint(int x, int y)
        {
            Clients.Others.startPaint(x,y);
        }

        public void Draw(int x, int y)
        {
            Clients.Others.draw(x, y);
        }

        public void EndPaint()
        {
            Clients.Others.endPaint();
        }

        public void ChangeColor(string color)
        {
            Clients.Others.changeColor(color);
        }
    }
}