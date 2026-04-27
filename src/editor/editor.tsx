import React from "react"
import { createRoot } from "react-dom/client"
import "../styles.css"
import { EditorApp } from "./EditorApp"

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <EditorApp />
  </React.StrictMode>,
)