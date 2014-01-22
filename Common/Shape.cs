using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Tablero.Common
{
    public class Shape
    {
        public List<Point> Coordinates { get; set; }
        public int LineWidth { get; set; }
        public string Color { get; set; }
    }
}