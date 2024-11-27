import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

let post = [];

app.use(express.static("public/"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  post = [];
  res.render("index.ejs");
});

app.post("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/create", (req, res) => {
  res.render("create.ejs");
});

app.post("/createpost", (req, res) => {
  const title = req.body["title"];
  const content = req.body["content"];
  
  post.push(
    {
      title: title,
      content: content
    }
  );
  const pageHeader = `<%- include("partials/header.ejs"); %>`;
  const pageFooter =`<%- include("partials/footer.ejs"); %>`;
  const pageTitle = "<h1>" + title + "</h1>";
  const pageContent = "<p>" + content + "</p>";
  const returnButton = `<form action="/" method="POST"><input type="submit" value="Return"></form>`;
  const fullPage = pageHeader + pageTitle + pageContent + returnButton + pageFooter;
  fs.writeFile(path.join(__dirname, "/views", title + ".ejs"), fullPage, (err) => {
    if (err) throw err;
  });
  const postLength = post.length;
  res.render("index.ejs", {posts: post, postLength: postLength});
});

app.post("/edit", (req, res) => {
  res.render("edit.ejs");
  });

app.post("/:postTitle", (req, res) => {
  const postTitle = req.params.postTitle;

  fs.access(path.join(__dirname, "views", `${postTitle}.ejs`), fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send("Post not found!");
    } else {
      res.render(postTitle);
    }
  });
});

app.get("/:deleteTitle/delete", (req, res) => {
  const deleteTitle = req.params.deleteTitle;

  post = post.filter((p) => p.title !== deleteTitle);

  fs.access(path.join(__dirname, "views", `${deleteTitle}.ejs`), fs.constants.F_OK, (err) => {
    if (err) {
      res.status(404).send("File to delete not found!");
    } else {
      fs.unlink(path.join(__dirname, "/views", `${deleteTitle}.ejs`), (err) => {
        if (err) throw err;
        console.log(`Deleted ${deleteTitle}.ejs`);
        const postLength = post.length;
        res.render("index.ejs", {posts: post, postLength: postLength});
      });
    }
  });
});

app.get("/editpost/:editTitle", (req, res) => {
  const editTitle = req.params.editTitle;

  // Buscar el post con el título dado
  const postToEdit = post.find((p) => p.title == editTitle);
  console.log(postToEdit);
  if (!postToEdit) {
    return res.status(404).send("Post not found");
  }
  // Agregar un log para verificar que se está pasando el post correctamente
  console.log("Post to edit:", postToEdit);
  // Renderizar el formulario de edición con el post encontrado
  res.render("edit.ejs", { postToEdit });
});

app.post("/newpost/:newTitle", (req, res) => {
  const oldTitle = req.body.oldTitle;
  const newTitle = req.body.newTitle;
  const newContent = req.body.newContent;
  
  console.log("Received data:", { oldTitle, newTitle, newContent });

  // Verifica si los datos están llegando correctamente
  if (!oldTitle || !newTitle || !newContent) {
    return res.status(400).send("Missing required fields");
  }
  // Actualizar el array de posts
  post = post.map((p) => {
    if (p.title === oldTitle) {
      p.title = newTitle;
      p.content = newContent;
    }
    return p;
  });

  const oldFilePath = path.join(__dirname, "/views", `${oldTitle}.ejs`);
  const newFilePath = path.join(__dirname, "/views", `${newTitle}.ejs`);

  // Renombrar archivo si cambió el título
  if (oldTitle !== newTitle) {
    fs.rename(oldFilePath, newFilePath, (err) => {
      if (err) {
        console.error("Error renaming file:", err);
        return res.status(500).send("Error renaming file");
      }
      updatePostFile(newFilePath, newTitle, newContent, res);
    });
  } else {
    updatePostFile(oldFilePath, newTitle, newContent, res);
  }
});

// Función auxiliar para actualizar el contenido del archivo
function updatePostFile(filePath, title, content, res) {
  const pageHeader = `<%- include("partials/header.ejs"); %>`;
  const pageFooter = `<%- include("partials/footer.ejs"); %>`;
  const pageTitle = `<h1>${title}</h1>`;
  const pageContent = `<p>${content}</p>`;
  const returnButton = `<form action="/" method="POST"><input type="submit" value="Return"></form>`;
  const fullPage = pageHeader + pageTitle + pageContent + returnButton + pageFooter;

  fs.writeFile(filePath, fullPage, (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return res.status(500).send("Error writing file");
    }
    console.log(`${title}.ejs updated successfully`);
    res.render("index.ejs", { posts: post, postLength: post.length });
  });
}

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});