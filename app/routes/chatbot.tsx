import { Outlet, useNavigate, useLocation } from "react-router";
import React from "react";
import type { Route } from "./+types/chatbot";
import ChatbotWhatsApp from "../components/ChatbotWhatsApp";

export function meta() {
  return [
    { title: "Chatbot WhatsApp | CRM DESEO DIGITAL" },
    { name: "description", content: "Asistente virtual con integración WhatsApp para atención al cliente" },
  ];
}

export default function ChatbotPage() {
  return <ChatbotWhatsApp />;
}

