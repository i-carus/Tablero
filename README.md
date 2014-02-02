Tablero
=======

This is an experiment at creating a whiteboard using the Canvas API and SignalR for .NET. I also wanted to experiment with WebRTC for video conferencing.

It is written as a jQuery plugin so you can really use it as a stand alone, very rudimentary, painting tool.

Usage: 

Given a canvas on an HTML document, you can create a new instance of a Whiteboard by doing:

   <canvas id='drawingCanvas' />
   
   <script>
        $(function){
          $('#drawingCanvas').Tablero();
          });
   </script>
   
The above code alone, will turn your canvas element into a rudimentary painting tool.

Some of the methods supported are:

    Tablero.reset(); --> Clears the canvas
    Tablero.changeBackgroundColor(color); 
    Tablero.changeColor(color); --> Lines are drawing on the color specified.
    Tablero.exportImage() --> Takes the image drawn and exports it as a png image.
    
    
As far as multiple users drawing on the same whiteboard, these are the methods supported:

    Tablero.draw(shape,user) --> draws the Shape on the Whiteboard. The user parameter simply identifies 
                                 who sent the image to the Whiteboard (via SignalR)
    Tablero.block(user) --> If you want to ignore updates from a user you would call this function.
    Tablero.unblock(user) --> This is to start "listening" again for any drawings done by the user.
    

Live Demo
========

You can see a live demo at http://marianasanchez.com - You can connect from 2 different browsers (IE support is lacking Video Conferencing but this is Microsoft's fault as they haven't done a thing to support WebRTC) and start drawing something on one of the browsers. Wha will happen is that all other clients connected to the website will immediately see what you draw. You can also have a 1 to 1 video conferecing by selecting the user from the list of users and clicnking on the video camera icon next to him. 

The app also supports "ignoring" updates from certain users so that in the event that you don't want to see what other people are drawing, you can uncheck the user from the list of users connected. 

Why do this?
=========

I just a fun project to familiarize myself with jQuery plugin development and the Canvas API in particular but I also wanted to develop a tool that would allow me to teach basic math to my daughters when I am travelling so that I could put them excerises and see how they tackle each problem. 



