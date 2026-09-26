let InputPesquisa = document.querySelector<HTMLInputElement>("#pesquisa input");
let Nome = document.querySelector("#nome")!;
let Telefone = document.querySelector("#telefone")!;
let Placa = document.querySelector("#placa")!;
let Tempo = document.querySelector("#tempo")!;
let entrada = document.querySelector<HTMLInputElement>("#entrada")
let sainda = document.querySelector<HTMLInputElement>("#sainda")
let buttonBuscar = document.querySelector<HTMLButtonElement>("#busca")
console.log("teste")


// estuda logica


let contador = document.querySelector("#contador")!;   // novo: crie esse elemento no HTML
let intervalo: number | undefined;                      // guarda o setInterval atual

function formatarTempo(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;

    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
}


async function enviarReqDeBusca() {
    const nomeDigitado = InputPesquisa?.value ?? "";

    const respostaDoBack = await fetch(
        `/encontraMotorista?nomeDoCliente=${encodeURIComponent(nomeDigitado)}`
    );

    clearInterval(intervalo);   

    if (!respostaDoBack.ok) {
        Nome.textContent = "";
        Telefone.textContent = "";
        Placa.textContent = "";
        Tempo.textContent = "";
        contador.textContent = "";
        if (entrada) entrada.textContent = "";
        if (sainda) sainda.textContent = "";
        console.log("Motorista não encontrado");
        return;
    }

    const dados = await respostaDoBack.json();

    const horaEntrada = new Date(dados.entrada);
    const saidaEmMs = dados.entrada + dados.tempo * 60 * 1000;
    const horaSaida = new Date(saidaEmMs);

    const formato: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

    Nome.textContent = dados.nome;
    Telefone.textContent = dados.telefone;
    Placa.textContent = dados.placa;
    Tempo.textContent = formatarTempo(dados.tempo);   // permanência

    if (entrada) entrada.textContent = horaEntrada.toLocaleTimeString("pt-BR", formato);
    if (sainda) sainda.textContent = horaSaida.toLocaleTimeString("pt-BR", formato);

   
    function atualizarContador() {
        const restante = saidaEmMs - Date.now();

        if (restante <= 0) {
            contador.textContent = "Tempo esgotado";
            clearInterval(intervalo);
            return;
        }

        const minutos = Math.floor(restante / 60000);
        const segundos = Math.floor((restante % 60000) / 1000);
        contador.textContent = `${minutos}:${String(segundos).padStart(2, "0")}`;
    }

    atualizarContador();                               
    intervalo = setInterval(atualizarContador, 1000);  
}

buttonBuscar?.addEventListener("click", () => {
    enviarReqDeBusca();
});