import { Optional } from "../types/optional";

export abstract class Alert {

	static error(message = "Something went wrong. Please, try again later.", title = "Error!") {
		const modal = document.getElementById("dialog-error") as Optional<HTMLDialogElement>;
		if (!modal) throw new Error("Modal not found");

		const titleElement = modal.querySelector("h2");
		if (!titleElement) throw new Error("Title not found");
		titleElement.innerText = title;

		const messageElement = modal.querySelector("p");
		if (!messageElement) throw new Error("Message not found");
		messageElement.innerText = message;

		modal.showModal();
	}

}