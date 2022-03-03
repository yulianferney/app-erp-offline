/*
 |--------------------------------------------------------------------------
 | Login Mahal
 |--------------------------------------------------------------------------
 */

'use strict';

(function ($) {
  $(document).ready(function () {

    //Verificar usuario
    $("#iniciar_sesion").click(function(){ validar_usuario(); });

    //Verificar usuario
    $("#password").on('keypress', function (e) { if(e.which === 13){ validar_usuario(); } });
    

    //Funciones

    //Función para calcular cantidad de clientes
    async function validar_usuario(){

      //Parametros Ajax
      $("#iniciar_sesion").html('<i class="fa fa-refresh fa-spin"></i>&nbsp;Iniciar sesión');
      let destino_ = "php/sync/login.php";
      let data_    = 'ema='+$("#email").val()+'&pas='+$("#password").val();
      let type_    = 'GET';

      //Procesando solicitud
      await send_(type_, destino_, data_).then( 
        (resp)=>{ 
        	console.log(resp);
          $("#iniciar_sesion").html("Iniciar sesión");
          if (resp.length > 0) { 
            switch(resp[0]["ROL"]){
              case 0: window.location.href = "index.php"; break;
              case 1: window.location.href = "../app/index.php"; break;
              case 2: window.location.href = "index.php"; break;
            }
          }
          else{ 
            message_(
              '<i class="fa fa-times"></i>',
              'Error',
              'Usuario o contraseña incorrectos...',
              'danger'
            );
          }
        },
        (error)=>{ 
          message_(
              '<i class="fa fa-times"></i>',
              'Opss',
              'Revisa tu conexión a internet e intenta iniciar sesión nuevamente',
              'danger'
            );
        }
      );
    }



    //Función promesa para procesar todas las peticiones Ajax
    function send_(type_, destino_, data_){
      return new Promise(function(resolve, reject) {
        $.ajax({
          async:true,
          type: type_,
          timeout:60000,
          dataType: "html",
          contentType: "application/x-www-form-urlencoded",
          url:destino_,
          data:data_,
          beforeSend:function(){},
          success:function (datos){ return resolve( JSON.parse(datos) ); },
          error:function (error){ return reject(error); }
        }); 
      });
    }

    //Función para mostrar mensajes
    function message_(icon_, title_, message_, type_){
      $.notify({
        // options
        icon: icon_,
        title: title_,
        message: message_
      },{
        type: type_,
      });
    }

    

    
  });
})(jQuery);
