// auth.js

import { signInWithPopup, signOut, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"

import { auth, provider } from "./firebase.js"

export function login() {
  return signInWithPopup(auth, provider)
}

export function logout() {
  return signOut(auth)
}

export function observeAuth(callback) {
  onAuthStateChanged(auth, callback)
}