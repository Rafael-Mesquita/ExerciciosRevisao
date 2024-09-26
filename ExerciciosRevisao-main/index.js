// Importa o framework Express para criar e configurar o servidor web
const express = require("express")

// Importa o Zod, uma biblioteca para validação de dados
const { z } = require("zod")

// Importa o modelo 'Contato' de um arquivo de models, que provavelmente se refere a um banco de dados
const { Contato } = require('./models')

// Importa o módulo fs para manipulação de arquivos.
const fs = require("fs");

// Importa o módulo path para manipulação de caminhos de arquivos.
const path = require("path");

// Inicializa o aplicativo Express
app = express()

// Middleware para registrar acessos
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.originalUrl}\n`; // Cria a linha de log
    fs.appendFile(path.join(__dirname, 'access.log'), log, (err) => { // Adiciona a linha ao arquivo access.log
        if (err) {
            console.error("Erro ao escrever no arquivo de log:", err); // Se houver erro, exibe no console
        }
    });
    next(); // Chama o próximo middleware/rota
});

// Define um esquema de validação de dados para "Contato" usando Zod
const contatoSchema = z.object({
    // O campo 'nome' é obrigatório, deve ser uma string e ter no mínimo 3 caracteres
    nome: z.string({ message: "Campo nome é obrigatório" })
        .min(3, { message: "O nome deve ter no mínimo 03 caracteres." }),

    // O campo 'telefone' deve corresponder a um padrão regex de telefone no formato (XX) XXXXX-XXXX
    telefone: z.string()
        .regex(/^\(\d{2}\) \d{5}-\d{4}$/, { message: "Deve enviar um telefone válido" }),

    // O campo 'email' é obrigatório e deve ser um e-mail válido.
    email: z.string({ message: "Campo e-mail é obrigatório." })
        .email({ message: "Deve ser um e-mail válido." })
})



// Configura o motor de templates 'EJS' para renderizar views HTML
app.set("view engine", "ejs")

// Define a pasta onde as views (arquivos EJS) estão localizadas
app.set("views", "./views")

// Configura o middleware para tratar requisições com dados codificados como URL (formulários HTML)
app.use(express.urlencoded({ extended: true }))


// Define a rota GET para o caminho raiz ("/"). Renderiza a view "index.ejs"
app.get("/", (req, res) => {
    res.render("index")
})

// Define a rota POST para o caminho raiz ("/"), onde dados de contato são enviados
app.post("/", async (req, res) => {
    // Pega os dados do corpo da requisição (enviados via formulário)
    const contato = req.body

    // Valida os dados do contato com base no schema definido anteriormente
    const resultado = contatoSchema.safeParse(contato)

    // Se a validação falhar:
    if (!resultado.success) {
        // Extrai as mensagens de erro.
        const erros = resultado.error.issues.map(issue => {
            return issue.message
        });
        // Envia os erros concatenados como resposta
        res.send(erros.join(";"))
    } else {
        // Se a validação for bem-sucedida, cria um novo registro de contato no banco de dados
        await Contato.create({ nome: contato.nome, telefone: contato.telefone, email: contato.email });
        // Envia uma mensagem de sucesso.
        res.send("Contato salvo com sucesso")
    }
})

// Define a rota GET para "/contatos", que lista todos os contatos
app.get("/contatos", async (req, res) => {
    try {
        // Busca todos os contatos no banco de dados
        const contatos = await Contato.findAll()
        // Renderiza a view "contatos.ejs", passando os contatos encontrados
        res.render("contatos", { contatos })
    } catch (error) {
        // Em caso de erro, envia uma mensagem de erro com status 500 (erro no servidor)
        res.status(500).send("Erro ao listar os contatos")
    }
})

// Inicializa o servidor na porta 4000 e exibe uma mensagem no console
app.listen(4000, () => {
    console.log("rodando...")
})
