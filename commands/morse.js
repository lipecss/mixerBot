exports.run = async (data, args, userId, channelId, socket, msg) => {
  let alpha = " ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split(""),
	morse = "/,.-,-...,-.-.,-..,.,..-.,--.,....,..,.---,-.-,.-..,--,-.,---,.--.,--.-,.-.,...,-,..-,...-,.--,-..-,-.--,--..,.----,..---,...--,....-,.....,-....,--...,---..,----.,-----".split(","),
	text = args.join(" ").toUpperCase();
	while (text.includes("Ä") || text.includes("Ö") || text.includes("Ü")) {
		text = text.replace("Ä","AE").replace("Ö","OE").replace("Ü","UE");
	}if(!args.length) return message.channel.send("<:i_:571125858161655828> | Informe algo para converter! Para ajuda digite: `?morse help`").then(msg => {msg.delete(5000)});
	if (text.startsWith(".") || text.startsWith("-")) {
		text = text.split(" ");
		let length = text.length;
		for (i = 0; i < length; i++) {
					text[i] = alpha[morse.indexOf(text[i])];
		}
		text = text.join("");
	} else {
		text = text.split("");
		let length = text.length;
		for (i = 0; i < length; i++) {
			text [i] = morse[alpha.indexOf(text[i])];
		}
			textMorse = text.join(" ");
		}
		return socket.call('msg', [textMorse]);
}