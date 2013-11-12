var ProjectsDAO = require('../dao/projectDAO').ProjectsDAO;

function ProjectHandler (db) {
    
    var objProjectsDAO = new ProjectsDAO(db);
    
    this.handleNewProject= function(req, res, next) {
        console.log("handleNewProject");
        console.log(typeof req.body.proyecto,"typeof req.body.proyecto");
        if(typeof req.body.proyecto === "undefined"){
            console.log(400);
            res.status(400);
            return res.send("{Valor de proyecto obligatorio}");
        }
        
        var nombre = req.body.proyecto;
        var funcion_crear_cromosoma = req.body.crear_cromosoma;
        
        console.log(req.body,'req.body');
        
        var nuevo_proyecto = {"proyecto":nombre,"funcion_crear_cromosoma":funcion_crear_cromosoma};
        
        objProjectsDAO.newProject(nuevo_proyecto,function(error,doc){
            console.log(error,"error");
            console.log(doc,"doc");
            var respuesta = {};
            if(doc){
                respuesta.ok = true;
                res.status(200);
            }else{
                respuesta.ok = false;
                ///TODO: enviar la especificacion de por que es el error
                res.status(400);
            }
            res.send(JSON.stringify(respuesta));        
        });
    }
}
module.exports = ProjectHandler;