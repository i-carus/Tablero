$(function () {
    var tablero = null;
    var tableroHub = $.connection.tableroHub;
    var name = $.cookie('name');
    var videoRecipient = '';
    var pc_config = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };
    var pc_constraints = { "optional": [{ "DtlsSrtpKeyAgreement": true }] };
    var pc = null;

    //var pc_config = {
    //    "iceServers": [{ "url": "stun:stun.l.google.com:19302" }, { "url": "stun:stun.l.google.com:19302" },
    //        { "url": "stun:stun1.l.google.com:19302" },
    //        { "url": "stun:stun2.l.google.com:19302" },
    //        { "url": "stun:stun3.l.google.com:19302" },
    //        { "url": "stun:stun4.l.google.com:19302" },
    //        { "url": "stun:stun01.sipphone.com" },
    //        { "url": "stun:stun.ekiga.net" },
    //        { "url": "stun:stun.fwdnet.net" },
    //        { "url": "stun:stun.ideasip.com" },
    //        { "url": "stun:stun.iptel.org" },
    //        { "url": "stun:stun.rixtelecom.se" },
    //        { "url": "stun:stun.schlund.de" },
    //        { "url": "stun:stunserver.org" },
    //        { "url": "stun:stun.softjoys.com" },
    //        { "url": "stun:stun.voiparound.com" },
    //        { "url": "stun:stun.voipbuster.com" },
    //        { "url": "stun:stun.voipstunt.com" },
    //        { "url": "stun:stun.voxgratia.org" },
    //        { "url": "stun:stun.xten.com" }]
    //};

    ///Establishes the connection with the Hub
    var connect = function () {
        $.connection.hub.start().done(function () {
            tablero = $('#c').Tablero({
                remoteDraw: function (shape) {
                    tableroHub.server.draw(shape);
                }
            });
        }).then(function () {
            tableroHub.server.getConnectedUsers(name);
            $('#user_name').text('Welcome, ' + name.substring(0, 1).toUpperCase() + name.substring(1));
        }).fail(function (error) {
            console.log(error);
        });
    };

    var hangUp = function () {
        if (pc) {
            $.each(pc.getLocalStreams(), function(index, value) {
                value.stop();
            });
            $.each(pc.getRemoteStreams(), function(index, value) {
                value.stop();
            });
            var remoteVideo = document.getElementById('remoteVideo');
            var localVideo = document.getElementById('localVideo');
            remoteVideo.src = '';
            localVideo.src = '';
            $('#videoContainer').hide();
        }
    };

    var iceCandidates = [];

    var video_constraints = {
        audio: true,
        video: {
            mandatory: {
                maxWidth: 320,
                maxHeight: 240
            },
            optional: []
        }
    };


    if (name == null || name == '') {
        $('#modal_name').modal();
    } else {
        connect();
    }

    /*
    *  WebRTC-related methods to initiate a video-conferencing call.
    */

    /*
       The video conference handshake starts when one user requests to start a video conference. 
       (See click handler for .fa-video-camera.) At that point an Offer (Session Description Object) 
       is generated and sent to the intended recipient. The server invokes this method (from the HUB) on the
       intended recipient so that he can accept the offer and set it as its remoteDescription on his RTCPeerConnection. 
       In turn, the recipient generates an Answer (another SDP object) and sends it back to the caller so that he can
       set this Answer as its own remoteDescription on the RTCPeerConnection 
    */
    tableroHub.client.acceptOffer = function (offer, otherPeer) {
        var result = $.parseJSON(offer);
        getUserMedia(video_constraints, function (localStream) {
            var localVideo = document.getElementById('localVideo');
            attachMediaStream(localVideo, localStream);
            pc.addStream(localStream);
            $('#remoteTitle').html('<span class="glyphicon glyphicon-user"></span> ' + otherPeer);
            pc.setRemoteDescription(new RTCSessionDescription(result.sdp), function () {
                pc.createAnswer(function (answer) {
                    pc.setLocalDescription(answer, function () {
                        $.each(iceCandidates, function (index, value) {
                            if (value != undefined && value != null) {
                                pc.addIceCandidate(new RTCIceCandidate(value));

                            }
                        });
                        tableroHub.server.sendAnswer(JSON.stringify({ 'sdp': answer }), otherPeer);
                    });
                });
            });


        }, function (error) {
            console.log('unable to get video going', error);
        });
    };


    /*
    *  Since the recipient replied with an "Answer" (SDP) it calls this method on the caller
    *  so that he can take the answer and set it as its remoteDescrption on its RTCPeerConnection
    */
    tableroHub.client.acceptAnswer = function (answer) {
        var descrip = new RTCSessionDescription($.parseJSON(answer).sdp);
        pc.setRemoteDescription(descrip, function () {
            $.each(iceCandidates, function (index, value) {
                if (value != undefined && value != null) {
                    pc.addIceCandidate((value));
                }
            });
            iceCandidates.length = 0; //Handshake done. Clear the ICE.
        }, function (error) {
            console.log(error);
        });
    };

    /* If the caller sends an Offer (SDP object - Session Description Protocol)
    * A bunch of ICE candidates will be generated automatically. 
    * The caller needs to send this information over to the recipient.
    * But BOTH, the caller and the recipient SHOULD NOT add the candidates to the
    * RTCPeerConnection until each calls remoteDescription on the RTCPeerConnection
    */
    tableroHub.client.receiveCandidate = function (ice) {
        var m = $.parseJSON(ice);
        if (m.candidate) {
            iceCandidates.push(m.candidate);
        }

    };


    // Create an RTCPeerConnection via the polyfill (adapter.js).
    if (window.RTCPeerConnection) {
        pc = new RTCPeerConnection(pc_config, pc_constraints);
        //var pc = new RTCPeerConnection(null);

        /*
   * This method fires always on the peer initiating the call.
   * Store the ICE in a local array and add all of them as soon as you
   * get the Answer from the remote peer, after you have called setRemoteDescription
   */
        pc.onicecandidate = function (evt) {
            if (evt.candidate) {
                iceCandidates.push(evt.candidate); //add it for now
                tableroHub.server.sendCandidate(JSON.stringify({ 'candidate': evt.candidate }), videoRecipient);
            }
        };

        /*
        * Ok, we got remote video! attach it to the page. We are done!
        */
        pc.onaddstream = function (evt) {
            var remoteVideo = document.getElementById('remoteVideo');
            $('#videoContainer').show();
            attachMediaStream(remoteVideo, evt.stream);
        };


        pc.onremovestream = function (evt) {
            console.log(evt);
        };

    }


    /*
    * Event handlers and initialization for the various widgets in the page
    */

    $('#btnhangup').click(function () {

        hangUp();
        tableroHub.server.hangUp();
        
    });

    $('#ok-name').click(function () {
        name = $('#name-text').val();

        if (name == '') {
            $('#modal_name').modal('show');
        } else {
            $('#modal_name').modal('hide');
            $.cookie('name', name);
            connect();
        }
    });

    $('.colorpalette').colorPalette().on('selectColor', function (e) {
        $(this).toggle();
        tablero.changeColor(e.color);
        $('#pick-color').css({ color: e.color });
    });

    $('#pick-color').click(function () {
        $('.colorpalette').toggle();
    });

    $('span[data-toggle="tooltip"]').tooltip();

    $('.reset').click(function () {
        tableroHub.server.reset();
        tablero.reset();
    });

    $('.eraser').click(function () {
        tablero.eraser();
    });

    $('.switch-back').click(function () {
        tablero.changeBackgroundColor($(this).text());

    });

    $('.export').click(function () {
        tablero.exportImage();
    });

    $(document).on('click', 'i.fa-video-camera:not(.disabled)', function () {
        var user = $(this).parent().text();
        getUserMedia(video_constraints, function (localStream) {
            try {
                videoRecipient = user;
                var video = document.getElementById('localVideo');
                pc.addStream(localStream);
                attachMediaStream(video, localStream);
                $('#remoteTitle').html('<span class="glyphicon glyphicon-user"></span> ' + user);
                $('#videoContainer').show();
                pc.createOffer(function (desc) {
                    pc.setLocalDescription(desc, function () {
                        tableroHub.server.sendOffer(JSON.stringify({ 'sdp': desc }), videoRecipient);
                    });
                });

            } catch (e) {
                console.log(e);
                alert("there's no one to talk to :_(");
            }
        }, function (error) {
            console.log('Error initiating video conference', error);
        });

    });

    $(document).on('click', 'input.block:enabled', function () {
        var user = $(this).parent().text();

        if (this.checked) {
            tablero.unblock(user);
        } else {
            tablero.block(user);
        }
    });

    //prevent scrolling on touch devides
    //document.body.addEventListener('touchmove', function(event) {
    //    event.preventDefault();
    //}, false);

    ///UI initialization of some widgets
    $('#c').width($('.container').width());
    $('#c').height($(document).height() - 250);
    $('#pick-color').css({ color: 'yellow' });

    /*
    *  Tablero-related functions
    */
    //Client-side implementations of the HUB functions (see TableroHub.cs)
    tableroHub.client.reset = function (sender) {
        tablero.reset(sender);
    };

    tableroHub.client.draw = function (shape, sender) {
        tablero.draw(shape, sender);
    };

    tableroHub.client.changeColor = function (color) {
        tablero.changeColor(color);
    };

    tableroHub.client.listConnectedUsers = function (users) {
        var content = '';
        var count = 0;
        $.each(users, function (index, value) {
            content += $('<li/>').text(value.user + (value.connection_id == $.connection.hub.id ? ' (You)' : '')).append('<input class="block" type="checkbox" ' + (tablero.isUserIgnored(value.user) == false ? 'checked="checked" ' : '') + (value.connection_id == $.connection.hub.id ? ' disabled="disabled" ' : '') + ' "  />').append('  <i style="cursor:pointer;" class="fa fa-video-camera ' + (value.connection_id == $.connection.hub.id ? ' disabled ' : '') + '"></i>').wrapInner('<span class="checkbox" />').wrapInner("<a/>")[0].outerHTML;
            count++;
        });
        $('#counter').text(count);
        $('#status').html(content);
    };

    tableroHub.client.hangUp = function() {
        hangUp();
    };

});