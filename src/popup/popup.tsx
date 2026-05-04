import React from "react"
import { createRoot } from "react-dom/client"
import "../styles.css"
import { PopupApp } from "./PopupApp"

document.documentElement.classList.add("popup-document")
document.body.classList.add("popup-body")

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>,
)
