import express from 'express';
import database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import cors from 'cors';
import 'dotenv/config';
import jwt from 'jsonwebtoken'
import path from "path";
import { fileURLToPath } from "url";


const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

 const db = new database('banco.db');



db.exec(`
   CREATE TABLE IF NOT EXISTS login (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL
   )
`);

db.exec(`
   CREATE TABLE IF NOT EXISTS CadastroCliente(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    telefone TEXT NOT NULL UNIQUE,
    tempo INTEGER NOT NULL,
    placa TEXT NOT NULL UNIQUE,
    modelo TEXT NOT NULL,
    cor TEXT NOT NULL,
    entrada INTEGER NOT NULL,
    avisado INTEGER NOT NULL DEFAULT 0
)
`);

db.exec(`
   CREATE TABLE IF NOT EXISTS vagas_ocupadas (
    numero INTEGER PRIMARY KEY,
    cliente_id INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (cliente_id) REFERENCES CadastroCliente(id)
   )
`);

async function criarUsuario() {


    const email = process.env.DEMO_EMAIL;
    const senhaPura = process.env.DEMO_SENHA;



    if (!email || !senhaPura) {
        console.log('DEMO_EMAIL ou DEMO_SENHA não definidos no .env — seed ignorado.');
        return;
    }

    try {
        const senhaHash = await bcrypt.hash(senhaPura, 10);
        const inserir = db.prepare('INSERT INTO login(email, senha) VALUES (?, ?)');
        inserir.run(email, senhaHash);
        console.log('Usuário demo criado com sucesso.');
    } catch (erro) {

        if (erro.message.includes('UNIQUE')) {
            console.log('Usuário demo já existe, seed ignorado.');
        } else {
            console.log('ERRO REAL ao criar usuário demo:', erro.message);
        }
    }
}

await criarUsuario();

function autenticar(req,res,next){
    const token = req.headers.authorization.split('')[1];
    if(!token){
        return res.status(401).json({erro:'Token nao fornecido'})
    
    
        try{
            req.usuario = jwt.verify(token,process.env.JWT_SECRET)
            next()
        }
        catch{
            res.status(401).json({erro:'Token invalido ou expirado'})
        }

    }
}

app.post('/login',autenticar, async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
        }

        const buscar = db.prepare('SELECT * FROM login WHERE email = ?');
        const usuario = buscar.get(email);

        if (!usuario) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: 'Email ou senha inválidos' });
        }
        const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ mensagem: 'Login realizado com sucesso', status: true, token });
     

    } catch (erro) {
        console.log('ERRO REAL no login:', erro.message);
        res.status(500).json({ erro: 'Erro ao realizar login' });
    }
});



const TOTAL_VAGAS = 60;

const cadastraComVaga = db.transaction((dados) => {
    const { nome, cpf, telefone, tempo, placa, modelo, cor } = dados;

    const resultado = db.prepare(`
        INSERT INTO CadastroCliente(nome,cpf,telefone,tempo,placa,modelo,cor,entrada)
        VALUES (?,?,?,?,?,?,?,?)`).run(nome, cpf, telefone, tempo, placa, modelo, cor, Date.now());
    const clienteId = resultado.lastInsertRowid;


    const ocupada = db.prepare(`SELECT numero FROM vagas_ocupadas`)
        .all()
        .map(linha => linha.numero)

    const livres = []
    for (let n = 1; n <= TOTAL_VAGAS; n++) {
        if (!ocupada.includes(n)) livres.push(n);
    }

    if (livres.length === 0) {
        throw new Error('LOTADO');
    }
    const vaga = livres[Math.floor(Math.random() * livres.length)];


    db.prepare('INSERT INTO vagas_ocupadas (numero, cliente_id) VALUES (?, ?)')
        .run(vaga, clienteId);

    return vaga;
})


app.post('/Cadastro',autenticar, async (req, res) => {
    try {
        const { nome, cpf, telefone, tempo, placa, modelo, cor } = req.body;

        if (!nome || !cpf || !telefone || !tempo || !placa || !modelo || !cor) {
            return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
        }

        const vaga = cadastraComVaga({ nome, cpf, telefone, tempo, placa, modelo, cor, });

        res.json({ mensagem: 'Cadastro realizado com sucesso', status: true, vaga });

    } catch (erro) {
        console.log('ERRO REAL no cadastro:', erro.message);

        if (erro.message === 'LOTADO') {
            return res.status(409).json({ erro: 'Estacionamento lotado' });
        }
        if (erro.message.includes('UNIQUE')) {
            if (erro.message.includes('cpf')) {
                return res.status(409).json({ erro: 'CPF já cadastrado' });
            }
            if (erro.message.includes('telefone')) {
                return res.status(409).json({ erro: 'Telefone já cadastrado' });
            }
            if (erro.message.includes('placa')) {
                return res.status(409).json({ erro: 'Placa já cadastrada' });
            }
            return res.status(409).json({ erro: 'Registro duplicado' });
        }

        res.status(500).json({ erro: 'Erro ao cadastrar' });


    }
});


app.get('/encontraMotorista',autenticar,(req, res) => {
    try {
        const { nomeDoCliente } = req.query;

        if (!nomeDoCliente) {
            return res.status(400).json({ erro: 'Parâmetro "nomeDoCliente" é obrigatório' });
        }

        const buscarMotorista = db.prepare('SELECT * FROM CadastroCliente WHERE nome = ?');
        const motorista = buscarMotorista.get(nomeDoCliente);

        if (!motorista) {
            return res.status(404).json({ mensagem: 'Informação não encontrada' });
        }

        const { telefone, nome, placa, tempo, entrada } = motorista;
        res.json({ telefone, nome, placa, tempo, entrada });

    } catch (erro) {
        console.log('ERRO REAL ao buscar motorista:', erro.message);
        res.status(500).json({ erro: 'Erro ao buscar motorista' });
    }
});



//  estudad logica e seus componentes e conexao
app.get('/vagas/ocupadas', (req, res) => {
    try {
        const linhas = db.prepare(`SELECT vagas_ocupadas.numero,CadastroCliente.tempo,CadastroCliente.entrada 
            FROM vagas_ocupadas INNER JOIN CadastroCliente 
            ON vagas_ocupadas.cliente_id = CadastroCliente.id`).all();




        res.json({ status: true, ocupadas: linhas });
    } catch (erro) {
        console.log('ERRO REAL ao listar vagas:', erro.message);
        res.status(500).json({ erro: 'Erro ao listar vagas' });
    }
});
const LIMITE_AVISO = 5 * 60 * 1000;   // 5 minutos

async function enviarMensagem(telefone, texto) {
    // Por enquanto só imprime, para testar a lógica.
    console.log(`ENVIANDO para ${telefone}: ${texto}`);
}

async function verificarAvisos() {
    try {
        const agora = Date.now();

        const clientes = db.prepare(`
            SELECT CadastroCliente.id, CadastroCliente.nome, CadastroCliente.telefone,
                   CadastroCliente.entrada, CadastroCliente.tempo
            FROM vagas_ocupadas
            INNER JOIN CadastroCliente ON vagas_ocupadas.cliente_id = CadastroCliente.id
            WHERE CadastroCliente.avisado = 0
        `).all();

        // usando para repetir uma acao sem uma quantidade expecifica
        for (const cliente of clientes) {
            const resto = cliente.entrada + cliente.tempo * 60 * 1000 - agora;

            if (resto < LIMITE_AVISO) {
                const telefone = '55' + cliente.telefone.replace(/\D/g, '');
                const texto = `Olá, ${cliente.nome}! Seu tempo no estacionamento está quase acabando. Se precisar de mais tempo, procure o atendente.`;

                await enviarMensagem(telefone, texto);

                db.prepare('UPDATE CadastroCliente SET avisado = 1 WHERE id = ?').run(cliente.id);
            }
        }
    } catch (erro) {
        console.log('ERRO REAL ao verificar avisos:', erro.message);
    }
}

setInterval(verificarAvisos, 30 * 1000);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});