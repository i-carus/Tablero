using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using WebGrease.Extensions;

namespace Tablero.Models
{
    public class TurnRecords
    {
        public string username { get; set; }
        public string password { get; set; }
        public int ttl { get; set; }
        public string[] uris { get; set; }

        public string[] url
        {
            get
            {
                return uris.Select(item => item.Split(new char[] { ':' }, StringSplitOptions.RemoveEmptyEntries)).Select(parts =>@" { "+ @" ""credential"" : """+password+@""" ,  ""url"" :  """+ parts[0] + ":" + username + "@" + parts[1]+@""" }").ToArray();
            }
        }

        public string BuildJson
        {
            get
            {
                StringBuilder sb = new StringBuilder();
                sb.Append("{");
                sb.Append(@"""url""");
                sb.Append(":");
                sb.Append(@"""stun:stun.turnservers.com:3478""");
                sb.Append("}");
                sb.Append(",");
                sb.Append(string.Join(",", url));
                return "["+sb.ToString()+"]";

            }
        }

    }

    
}