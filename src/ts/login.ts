const senha = document.querySelector<HTMLInputElement>("#senha");
const email = document.querySelector<HTMLInputElement>("#email");
const entra = document.querySelector<HTMLButtonElement>(".entrar");

if (!senha || !email || !entra) {
    throw new Error("Elemento de login não encontrado no HTML.");
}

const estruturaEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

entra.addEventListener("click", async () => {
    if (!senha.value.trim() || !email.value.trim()) {
        alert("Preencha email e senha.");
        return;
    }

    if (!estruturaEmail.test(email.value.trim())) {
        alert("Email em formato inválido.");
        return;
    }

    entra.disabled = true;
    try {
        const respostaLogin = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email.value.trim(),
                senha: senha.value
            })
        });

        let resultado: { status?: boolean; erro?: string };
        try {
            resultado = await respostaLogin.json();
        } catch {
            alert("Resposta inesperada do servidor.");
            return;
        }

        if (!respostaLogin.ok || !resultado.status) {
            alert(resultado.erro ?? "Email ou senha incorretos.");
            return;
        }

        window.location.href = "/src/pages/dashboard.html";
    } catch (erro) {
        console.log("Erro ao se conectar ao servidor", erro);
        alert("Não foi possível conectar ao servidor.");
        
    } finally {
        entra.disabled = false;
    }
});