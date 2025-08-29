if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

const puter = window.puter;

// Conversation state
let conversations = JSON.parse(localStorage.getItem("conversations")) || [];
let currentConversationId = null;
let conversationToDelete = null;
