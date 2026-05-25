// app/test/forgot-password.test.tsx
/// <reference types="jest" />
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ForgotPassword from "../forgot-password";

jest.mock("expo-router", () => ({
    router: { push: jest.fn(), back: jest.fn() },
}));

jest.mock("@expo/vector-icons", () => ({
    Ionicons: () => null,
}));

jest.mock("react-native/Libraries/Image/Image", () => "Image");

describe("ForgotPassword", () => {

    it("muestra el título correctamente", () => {
        const { getByText } = render(<ForgotPassword />);
        expect(getByText("¿Olvidaste tu contraseña?")).toBeTruthy();
    });

    it("muestra las dos opciones de recuperación", () => {
        const { getByText } = render(<ForgotPassword />);
        expect(getByText("Recuperar via Email")).toBeTruthy();
        expect(getByText("Recuperar via mensaje de texto")).toBeTruthy();
    });

    it("muestra el input de correo al seleccionar Email", () => {
        const { getByText, getByPlaceholderText } = render(<ForgotPassword />);
        fireEvent.press(getByText("Recuperar via Email"));
        expect(getByPlaceholderText("Correo electrónico")).toBeTruthy();
    });

    it("muestra el input de teléfono al seleccionar SMS", () => {
        const { getByText, getByPlaceholderText } = render(<ForgotPassword />);
        fireEvent.press(getByText("Recuperar via mensaje de texto"));
        expect(getByPlaceholderText("Teléfono")).toBeTruthy();
    });

    it("muestra alerta si se envía email vacío", async () => {
        const alertSpy = jest.spyOn(require("react-native").Alert, "alert");
        const { getByText } = render(<ForgotPassword />);
        fireEvent.press(getByText("Recuperar via Email"));
        fireEvent.press(getByText("ENVIAR EMAIL"));
        expect(alertSpy).toHaveBeenCalledWith("Error", "Por favor ingresa un correo válido.");
    });

    it("navega a verify-code al enviar email válido", () => {
        const { push } = require("expo-router").router;
        const { getByText, getByPlaceholderText } = render(<ForgotPassword />);
        fireEvent.press(getByText("Recuperar via Email"));
        fireEvent.changeText(getByPlaceholderText("Correo electrónico"), "test@correo.com");
        fireEvent.press(getByText("ENVIAR EMAIL"));
        expect(push).toHaveBeenCalledWith("/verify-code?flow=forgot");
    });

}); 