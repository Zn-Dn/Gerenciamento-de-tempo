let nomeInput = document.querySelector<HTMLInputElement>("#nome")!
let cpfInput = document.querySelector<HTMLInputElement>("#cpf")!
let telefoneInput = document.querySelector<HTMLInputElement>("#telefone")!
let tempoInput = document.querySelector<HTMLInputElement>("#tempo")!
let select = document.querySelector<HTMLSelectElement>("#escolharTempo select")!;

// Carro
let placa = document.querySelector<HTMLInputElement>("#placa")!
let modelo = document.querySelector<HTMLInputElement>("#modelo")!
let cor = document.querySelector<HTMLInputElement>("#cor")!


let button = document.querySelector<HTMLButtonElement>("#buttoncadastro")!

    const elementos = { nomeInput, cpfInput, telefoneInput, tempoInput, select, placa, modelo, cor, button };

for (const [nome, el] of Object.entries(elementos)) {
    if (!el) {
        throw new Error(`Elemento "${nome}" não encontrado no HTML.`);
    }
}


const testeCpf = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
const testeTelefone = /^\(\d{2}\) \d{5}-\d{4}$/;
const MODO_TESTE = true; // troca pra false quando for validar de verdade

function validacao(): boolean {
    if (MODO_TESTE) return true; // pula validação em teste

    const campos = [nomeInput, cpfInput, telefoneInput, placa, modelo, cor];
    if (campos.some(el => !el?.value.trim())) {
        alert("Preencha todos os campos.");
        return false;
    }
    if (!testeCpf.test(cpfInput!.value.trim())) {
        alert("CPF inválido.");
        return false;
    }
    if (!testeTelefone.test(telefoneInput!.value.trim())) {
        alert("Telefone inválido.");
        return false;
    }
    return true;
}




function  ParaMinutos(numero:number,uni:string):number {

      return uni === "horas" ? numero * 60 :numero
    
}


button?.addEventListener("click", async () => {


 if(!validacao()){
    return
 }
 const numero = Number(tempoInput.value);

  if(!numero || numero<= 0){
    alert("Digite um valor valido")
    return
  }

    const TempoEmMinutos = ParaMinutos(numero, select.value);

 let respostadoCadastro: { erro?: string };

button.disabled = true


    try{

    let cadastro = await fetch('/Cadastro', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: nomeInput.value.trim(),
            cpf: cpfInput.value.trim(),
            telefone: telefoneInput.value.trim(),
            tempo: TempoEmMinutos,
            placa: placa.value.trim(),
            modelo: modelo.value.trim(),
            cor: cor.value.trim()
        })
    })
 
   respostadoCadastro = await cadastro.json()

 if (!cadastro.ok) {
            alert(respostadoCadastro.erro);
            return;
        }
 console.log(respostadoCadastro)
}

 catch (erro) {
  
        // o fetch nem conseguiu falar com o servidor
        console.log("Erro ao se conectar ao servidor", erro);
        alert("Não foi possível conectar ao servidor");
        return
    }
    finally{
        button.disabled = false  
    }
   
})

