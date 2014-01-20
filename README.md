Tablero
=======

This is an experiment at creating a whiteboard using the Canvas API and SignalR for .NET. 

It is written as a jQuery plugin so you can really use it as a stand alone, very rudimentary, painting tool.

I personally use it with my daughters so I can teach them math remotely: They go to my personal website and everything
I pain on the screen, they can see on their screen. That way, I can see how they tackle a problem and get to the solution.
If they make a mistake, I can intervene and show them how is done.


Live Demo
========

You can see a live demo at http://marianasanchez.com - You can connect from 2 different browsers (IE support is still a bit buggy) and start drawing something on one of the browsers. Wha will happen is that all other clients connected to the website will immediately see what you drew. 

The app also supports "ignoring" updates from certain users so that in the event that you don't want to see what other people are drawing, you can uncheck the user from the list of users connected. 

Why do this?
=========

As I said, this is just a fun project to familiarize myself with jQuery plugin development and the Canvas API but I also wanted to develop a tool that would allow me to teach math to my daughters when I am travelling so that I could put them excerises and see how they tackle each problem. 


Future Plans
==========

The next step is to include some sort of audio/video streaming without requiring any third party tool such as Flash or Silverlight. I will soon start experimenting with streaming video between 2 participants via web sockets.
