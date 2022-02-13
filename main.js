let connectButton
let sendButton
let messageInputBox
let receiveBox

let sendChannel
let localConnection
let receiveChannel

const connectPeers = () => {
}

const startup = () => {
  connectButton = document.getElementById('connectButton');
  disconnectButton = document.getElementById('disconnectButton');
  sendButton = document.getElementById('sendButton');
  messageInputBox = document.getElementById('message');
  receiveBox = document.getElementById('receivebox');

  // Set event listeners for user interface widgets

  connectButton.addEventListener('click', connectPeers, false);
  disconnectButton.addEventListener('click', disconnectPeers, false);
  sendButton.addEventListener('click', sendMessage, false);

  // Set up local peer
  localConnection = new RTCPeerConnection();

  sendChannel = localConnection.createDataChannel("sendChannel");
  sendChannel.onopen = handleSendChannelStatusChange;
  sendChannel.onclose = handleSendChannelStatusChange;

  // Set up remote peer
  remoteConnection = new RTCPeerConnection();
  remoteConnection.ondatachannel = receiveChannelCallback;

  localConnection.onicecandidate = e => !e.candidate
    || remoteConnection.addIceCandidate(e.candidate)
      .catch(handleAddCandidateError);

  remoteConnection.onicecandidate = e => !e.candidate
    || localConnection.addIceCandidate(e.candidate)
      .catch(handleAddCandidateError);

  // Start the connection
  localConnection.createOffer()
    .then(offer => localConnection.setLocalDescription(offer))
    .then(() => remoteConnection.setRemoteDescription(localConnection.localDescription))
    .then(() => remoteConnection.createAnswer())
    .then(answer => remoteConnection.setLocalDescription(answer))
    .then(() => localConnection.setRemoteDescription(remoteConnection.localDescription))
    .catch(console.error);
}

function handleAddCandidateError() {
  connectButton.disabled = true;
}

function receiveChannelCallback(event) {
  receiveChannel = event.channel;
  receiveChannel.onmessage = handleReceiveMessage;
  receiveChannel.onopen = handleReceiveChannelStatusChange;
  receiveChannel.onclose = handleReceiveChannelStatusChange;
}

function handleSendChannelStatusChange(event) {
  if (sendChannel) {
    var state = sendChannel.readyState;

    if (state === "open") {
      messageInputBox.disabled = false;
      messageInputBox.focus();
      sendButton.disabled = false;
      disconnectButton.disabled = false;
      connectButton.disabled = true;
    } else {
      messageInputBox.disabled = true;
      sendButton.disabled = true;
      connectButton.disabled = false;
      disconnectButton.disabled = true;
    }
  }
}

function handleReceiveChannelStatusChange(event) {
  if (receiveChannel) {
    console.log("Receive channel's status has changed to " +
      receiveChannel.readyState);
  }
}

function sendMessage() {
  const message = messageInputBox.value;
  sendChannel.send(message);

  messageInputBox.value = "";
  messageInputBox.focus();
}

function handleReceiveMessage(event) {
  const el = document.createElement("p");
  const txtNode = document.createTextNode(event.data);

  el.appendChild(txtNode);
  receiveBox.appendChild(el);
}

function disconnectPeers() {

  // Close the RTCDataChannels if they're open.

  sendChannel.close();
  receiveChannel.close();

  // Close the RTCPeerConnections

  localConnection.close();
  remoteConnection.close();

  sendChannel = null;
  receiveChannel = null;
  localConnection = null;
  remoteConnection = null;

  // Update user interface elements

  connectButton.disabled = false;
  disconnectButton.disabled = true;
  sendButton.disabled = true;

  messageInputBox.value = "";
  messageInputBox.disabled = true;
}

startup()
