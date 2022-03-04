/*
 |--------------------------------------------------------------------------
 | Facturas venta
 |--------------------------------------------------------------------------
 */

'use strict';

(function ($) {
  $(document).ready(function () {

    //#######################
    // VARIABLES GLOBALES
    //#######################

    var facturas_venta      = [];
    var clientes            = [];
    var bancos              = [];
    var movimientos_bancos  = [];
    var categorias          = [];
    var categoriasE         = [];
    var listas_precios      = [];
    var precios             = [];
    var usuarios            = [];
    var impuestos           = [];
    var retenciones         = [];
    var inventario          = [];
    var items               = [];
    var itemsRetenciones    = [];
    var bancos_usuario      = [];
    var SYNC_ITEMS          = [];
    var resoluciones        = [];
    var cantidades_bodega   = [];
    var TOTAL_FACTURA       = 0;
    var _ID_BODEGA_USUARIO  = 1; 
    var editTable           = false;
    var online              = true;
    

    //COMPROBAR SESIÓN
    var _ID_CUENTA = localStorage.getItem("IDUSUARIO");
    if(_ID_CUENTA==null){
      window.location.href = "login.html";
    }else{
      $("#usuario").attr("alt", parseInt(_ID_CUENTA) );
      getDataFromStorage();
    }

    //#######################
    // CONFIGURACIÓN INICIAL
    //#######################

    //Config 
    const URL_SERVER = 'https://productosalimenticiosarfor.com/vendedor/';
    window.location.hash="no-back-button";
    window.location.hash="Again-No-back-button" //chrome
    window.onhashchange=function(){window.location.hash="no-back-button";}
    window.onbeforeunload = function() {  return "OJO! No te puede salir de la pàgina actual si estas en campo" }
    window.addEventListener("beforeunload", function (e) {
      var confirmationMessage = '';
      (e || window.event).returnValue = confirmationMessage; //Gecko + IE
      return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    });
    window.addEventListener('offline', function(){ online=false; });
    window.addEventListener('online', function(){ online=true; });
  
  
    //############################
    // CARGA DE DATOS DEL STORAGE
    //############################

    var ITEMS_STOGATE = localStorage.getItem("SYNC_ITEMS");
    if(ITEMS_STOGATE==null){
      localStorage.setItem("SYNC_ITEMS", JSON.stringify([]));
      $("#can_syncs").html(SYNC_ITEMS.length);
    }else{
      SYNC_ITEMS = JSON.parse(ITEMS_STOGATE);
      $("#can_syncs").html(SYNC_ITEMS.length);
    }


    //#######################
    // EVENTOS DE OBJETOS
    //#######################

    $("#facturas").click(function(){
    	var html_    = "";

    	for (var i = SYNC_ITEMS.length - 1; i >= 0; i--) {
    		if(SYNC_ITEMS[i]["FACTURA"]["FACTURA"]!=null){
          var cliente = get_cliente(SYNC_ITEMS[i]["FACTURA"]["FACTURA"]["_ID_CLIENTE"]);
    			html_ +=  "<tr>"+
        						  "<td>"+SYNC_ITEMS[i]["FACTURA"]["FACTURA"]["NUMERACION"]+"</td>"+
        						  "<td>"+cliente["NOMBRE"]+"</td>"+
        						  "<td>"+
        							 "<button type='button' class='btn btn-outline-success btn-circle print' alt='"+i+"'><i class='fa fa-print'></i></button>"+
        						  "</td>"+
        					  "</tr>";
    		}
    	}
    	$("#facturas_table_html").html(html_);
    });
    $( "#facturas_table_html" ).on( "click", ".print", function() {
      if($(this).hasClass("print")){
        var index = $(this).attr("alt");
        print_invoice(SYNC_ITEMS[index]["FACTURA"]["FACTURA"]);
      }
    });
    $("#btn_add_abono").click(function(){
        
      if(!confirm("¿Deseas registrar este abono?")){ return; } 
    	getNextNumberRec().then(
        (next)=>{

          //AGREGAR UN PAGO
          let abono = {
		        'ID'                   :null,
		        '_ID_BANCO'            :bancos_usuario[0]["_ID_BANCO"],
		        '_ID_USUARIO'          :$("#usuario").attr("alt"),
		        '_ID_CLIENTE'          :get_cliente_from_id_fac($("#add_pago_fac option:selected").val()),
		        '_ID_PROVEEDOR'        :0,
		        '_ID_FACTURA_VENTA'    :$("#add_pago_fac option:selected").val(),
		        '_ID_FACTURA_COMPRA'   :0,
		        '_ID_NOTA_DEBITO'      :0,
		        '_ID_NOTA_CREDITO'     :0,
                '_ID_CATEGORIA_GASTO'  :0,
                '_ID_CATEGORIA_INGRESO':$("#add_pago_cat option:selected").val(),
		        'NUMERACION'           :zfill(parseInt($("#usuario").attr("alt")),3)+"-"+zfill((next+1),5),
		        'METODO_PAGO'          :$("#add_pago_met option:selected").val(),
		        'DEBITO'               :parseInt($("#add_pago_abo").val()),
                'CREDITO'              :0,
                'PRODUCCION'           :0,
                'DISTRIBUCION'         :0,
		        'FECHA_HORA'           :moment().format("YYYY-MM-DD hh:mm:ss"),
		        'OBSERVACIONES'        :$("#add_pago_obs").val()
          };
            
		      var ITEM_SYNC = {
		        FACTURA:{
		          FACTURA :null,
		          PAGO    :null,
		          FAC_URL :null,
		          FAC_DAT :null,
		          PAG_URL :null,
		          PAG_DAT :null
		        },
		        PAGO:{
              PAGO    :abono,
            },
            GASTO:{
              GAS_URL :null,
		          GAS_DAT :null,
              GASTO   :null,
            }
		      };
		      //REGISTRAR EN EL STORAGE
		      SYNC_ITEMS.push(ITEM_SYNC);
		      localStorage.setItem("SYNC_ITEMS", JSON.stringify(SYNC_ITEMS));
		      movimientos_bancos.push(abono);
		     	BuildSelectCartera();
		      $("#can_syncs").html(SYNC_ITEMS.length);
		      $("#AddPagoModal").modal("hide");
		      $("#add_pago_fac").val("0");
		      $("#add_pago_abo").val("");
		      $("#add_pago_met").val("1");
		      $("#add_pago_obs").val("");
        }
      );
    });
    $("#btn_add_gasto").click(function(){
    	getNextNumberGas().then(
        (next)=>{

          //AGREGAR UN PAGO
          let gasto = {
		        'ID'                   :null,
		        '_ID_BANCO'            :bancos_usuario[0]["_ID_BANCO"],
		        '_ID_USUARIO'          :$("#usuario").attr("alt"),
		        '_ID_CLIENTE'          :0,
		        '_ID_PROVEEDOR'        :0,
		        '_ID_FACTURA_VENTA'    :0,
		        '_ID_FACTURA_COMPRA'   :0,
		        '_ID_NOTA_DEBITO'      :0,
		        '_ID_NOTA_CREDITO'     :0,
            '_ID_CATEGORIA_GASTO'  :$("#add_gasto_cat option:selected").val(),
            '_ID_CATEGORIA_INGRESO':0,
		        'NUMERACION'           :zfill(parseInt($("#usuario").attr("alt")),3)+"-"+zfill((next+1),5),
		        'METODO_PAGO'          :1,
		        'DEBITO'               :0,
            'CREDITO'              :parseInt($("#add_gasto").val()),
            'PRODUCCION'           :0,
            'DISTRIBUCION'         :0,
		        'FECHA_HORA'           :moment().format("YYYY-MM-DD hh:mm:ss"),
		        'OBSERVACIONES'        :$("#add_gasto_obs").val()
          };
            
		      var ITEM_SYNC = {
		        FACTURA:{
		          FACTURA :null,
		          PAGO    :null,
		          FAC_URL :null,
		          FAC_DAT :null,
		          PAG_URL :null,
		          PAG_DAT :null
		        },
		        PAGO:{
		          PAG_URL :null,
		          PAG_DAT :null,
              PAGO    :null,
            },
            GASTO:{
              GASTO   :gasto,
            }
		      };
		      //REGISTRAR EN EL STORAGE
		      SYNC_ITEMS.push(ITEM_SYNC);
		      localStorage.setItem("SYNC_ITEMS", JSON.stringify(SYNC_ITEMS));
		      movimientos_bancos.push(gasto);
		     	BuildSelectCartera();
		      $("#can_syncs").html(SYNC_ITEMS.length);
		      $("#AddGastoModal").modal("hide");
		      $("#add_gasto").val("");
		      $("#add_gasto_cat").val("0");
		      $("#add_gasto_obs").val("");
        }
      );
    });
    $('#fac_ven_fec').val(
      moment().format("YYYY-MM-DD HH:mm A")
    );
    $("#fac_ven_vau").change( function(e) { 
      cal_item_otr(); 
    });
    $("#fac_ven_can").change( function(e) { 
      cal_item_otr(); 
    });
    $("#fac_ven_des").change( function(e) { 
      cal_item_otr(); 
    });
    $("#fac_ven_dev").change( function(e) { 
      cal_item_otr(); 
    });
    $("#fac_ven_imp").change( function(e) { 
      cal_item_otr(); 
    });
    $("#fac_ven_tim").change( function(e) { 
      cal_item_otr(); 
    });
    $("#fac_ven_bas").change( function(e) {
      cal_item_otr(); 
    });
    $("#log").click(function(){
      $("#data_txt").val(localStorage.getItem("SYNC_ITEMS"));
      $("#dataModal").modal("show");
    });
    $("#copy_backup").click(function(){
      localStorage.setItem("SYNC_ITEMS", $("#data_txt").val());
      alert("se ha guardado la copia con éxito");
    });
    $("#sync").click(function(){
      if(confirm("¿Deseas iniciar la sincronización?")){

        //Errores
        if(!online){ alert("No hay conexión en este momento"); return; }
        if(SYNC_ITEMS.length == 0){ 
          if(confirm("No hay elementos para sincornizar, ¿Deseas actualizar datos?")){ 
            start_load(); 
            return; 
          }else{ 
            return; 
          } 
        }

        //Continuar con éxito
        $("#sync").html('<i class="fa fa-refresh fa-spin"></i>&nbsp;Sincronizando');
        let destino_ = "php/api/post-offline.php";
        let data_    = 'DATA='+JSON.stringify(SYNC_ITEMS)+
                         '&SHA1='+MD5(JSON.stringify(SYNC_ITEMS))+
                         '&_ID_USUARIO='+$("#usuario").attr("alt")+
                         '&FECHA_HORA='+moment().format('YYYY-MM-DD HH:mm');
        //Procesando solicitud
        send_(destino_, data_).then(
          (OK) => {
            $("#sync").html('<i class="fa fa-refresh"></i>&nbsp;Sincronizar<span class="badge badge-light" id="can_syncs">&nbsp;'+SYNC_ITEMS.length+'</span>');
            if(OK["ERROR"]){
              message_('','Oops!','No se pudo completar la sincronización','error');
            }else{ 
              SYNC_ITEMS = [];
              localStorage.setItem("SYNC_ITEMS", JSON.stringify([]));
              message_('','Bien!','Tu datos fueron enviados y procesados con éxito','success');
            }
            $("#sync").html('<i class="fa fa-refresh"></i>&nbsp;Sincronizar<span class="badge badge-light" id="can_syncs">0</span>');
          }
        );

      }
    });
    $('#fac_ven_fec').datetimepicker({
      locale:'es', 
      format:"YYYY-MM-DD HH:mm A"
    });
    $("#step1").click(function(){
      if($("#fac_ven_fec").val()!="0" && $("#fac_cli_lis option:selected").val()!="0"){ $('#tab_facturas a[href="#TAB2"]').tab('show');
      }else{ message_('<i class="fa fa-times"></i>','Oops!','Completa los campos correctamente','error');    }
    });
    $("#fac_cli_lis").change(function(){
    	if ($("#fac_cli_lis option:selected").val()!="0") {
    		for (var i = clientes.length - 1; i >= 0; i--) {
    			if(clientes[i]["ID"]==$("#fac_cli_lis option:selected").val()){
            if(clientes[i]["_ID_LISTA_PRECIOS"]==0){
              message_('Mensaje:', 'Este cliente NO tiene asignado una lista de precios, debes hacerlo antes de continuar', 'error', 'fa fa-times');
            }
    				$("#fac_ven_lpe").val(clientes[i]["_ID_LISTA_PRECIOS"]);
    				$("#fac_ven_des").val(clientes[i]["POR_DESCUENTO"]);
    				for (var j = impuestos.length - 1; j >= 0; j--) {
    					if(impuestos[j]["ID"]==clientes[i]["_ID_IMPUESTO"]){
    						$("#fac_ven_imp").val(impuestos[j]["PORCENTAJE"]);
    					}
    				}
            //Automatizar el proceso de facturación electronica
            if(clientes[i]["FACTURACION_DIAN"]==1){ $("#dian").prop( "checked", true );}
            if(clientes[i]["FACTURACION_DIAN"]==0){ $("#dian").prop( "checked", false );}
    			}
    		}
    	}
    });
    $("#fac_ven_tot").change(function(e) { 
      $("#fac_ven_obf").val("SALDO PENDIENTE: $"+TOTAL_FACTURA-parseInt($("#fac_ven_tot").val()));
    })
    $("#fac_ven_rap").change(function () {
      for (var i = inventario.length - 1; i >= 0; i--) {
        if(inventario[i]["REFERENCIA"]==$("#fac_ven_rap").val()){
          $("#fac_ven_obs").selectpicker('val', inventario[i]["ID"]);
          setTimeout(function(){cal_item_otr();},100);
        }
      }
    });
    $( "#btn_otr_add" ).click(function() {
      
      let _ID_ITEM = parseInt($("#fac_ven_obs option:selected").val());
      let VAL_UNIT = 0; if($("#fac_ven_vau").val()!="") VAL_UNIT = parseInt($("#fac_ven_vau").val());
      let CAN_UNIT = 0; if($("#fac_ven_can").val()!="") CAN_UNIT = parseInt($("#fac_ven_can").val());

      if(
        _ID_ITEM != 0 &&
        VAL_UNIT  > 0 &&
        CAN_UNIT  > 0
      ){
        var flag = true;
          for (var i = 0; i < cantidades_bodega.length; i++) {
            if ( cantidades_bodega[i]["_ID_ITEM"]  == parseInt($("#fac_ven_obs option:selected").val()) ){
              flag = false;
              if (parseInt(cantidades_bodega[i]["STOCK"])>=CAN_UNIT) {
                add_item();
                break;
              }else{
                message_('<i class="fa fa-times"></i>','Oops!','No hay la cantidad suficiente en Bodega','error');
                break;
              }
            }
          }
          if (flag) message_('<i class="fa fa-times"></i>','Oops!','No hay cantidades disponibles en Stock','error');
     }else{
        message_('<i class="fa fa-times"></i>','Oops!','Seleccionar un producto y el valor Unitario son Obligatorios','error');
     }
     //Hasta aqui
     cal_item_otr();
    });
    $( "#btn_otr_baj" ).click(function() {
      if($("#fac_ven_obs option:selected").val() != "0" &&
         $("#fac_ven_vau").val() != ""){
          add_baja();
    }else{
      alert('Seleccionar un producto y el valor Unitario son Obligatorios');
    }
    //Hasta aqui
    cal_item_otr();
    });
    $( "#items_table_html" ).on( "click", ".cl_item_del", function() {
      if($(this).hasClass("cl_item_del")){
        var index = $(this).attr("alt");
        items.splice(index, 1); //Eliminar el item
        BuildTableItems();
      }
    });
    $( "#items_table_html" ).on( "click", ".cl_item_edi", function() {
      if($(this).hasClass("cl_item_edi")){
        var index = $(this).attr("alt");
        $("#fac_ven_obs option:selected").text(items[index]["ITEM"]);
        $("#fac_ven_vau").val(items[index]["VALOR_UNITARIO"]);
        $("#fac_ven_can").val(items[index]["CANTIDAD"]);
        $("#fac_ven_des").val(items[index]["DESCUENTO"]);
        $("#fac_ven_imp option").filter(function() { return this.text == items[index]["IMPUESTO"]; }).attr('selected', true);
        cal_item_otr();
        $("#btn_otr_add").hide();
        $('#tab_facturas a[href="#TAB2"]').tab('show');
      }
    });
    $("#btn_save_factura").click(function(){
       createNewFac();
    });
    $("#fac_ven_met").change(function(){
      if( $("#fac_ven_met option:selected").val()=="7" ){
        $("#fecha_limite_de_pago").show();
      }else{
        $("#fecha_limite_de_pago").hide();
        $("#fac_ven_flp").val("");
      }
    });
    $("#fac_ven_tre").keyup(function(){
      //Calcular vueltos
      var _TOTAL_FACTURA = parseInt($("#fac_ven_tot").val());
      var _TOTAL_RECIBODO = parseInt($("#fac_ven_tre").val());
      $("#fac_ven_cam").val((_TOTAL_RECIBODO-_TOTAL_FACTURA));
    });
    $("#signout").click(function(){
      removeDataStorage();
    });


    //#######################
    // FUNCIONES DE PROCESOS
    //#######################
    function get_cliente_from_id_fac(_ID_FACTURA){
    	for (var i = facturas_venta.length - 1; i >= 0; i--) {
    		if(facturas_venta[i]["ID"]==_ID_FACTURA){
    			return facturas_venta[i]["_ID_CLIENTE"];
    		}
    	}
      return 0;
    }
    function BuildSelectCartera(){

    	//Declarar variables
      var pay                  = 0;
      var cliente              = [];
	    var total_facturado      = 0;
	    var total_recaudado      = 0;
	    var total_en_cartera     = 0;
	    $('#add_pago_fac').selectpicker('destroy', true);
		  $('#add_pago_fac option').each(function() { $(this).remove(); });
		  $("#add_pago_fac").append($('<option>', { value: 0, text : "Selecciona una factura" }));

	    for (var i = facturas_venta.length - 1; i >= 0; i--){
	    	//FACTUAS EN CARTERA
        pay = getPay(facturas_venta[i]["ID"]);
        if(
         	pay != parseInt(facturas_venta[i]["VALOR_FACTURA"]) &&
         	facturas_venta[i]["ID"] != null
        ){

          //Calculo de valores
         	cliente              = get_cliente(facturas_venta[i]["_ID_CLIENTE"]);
          total_facturado      = parseInt(facturas_venta[i]["VALOR_FACTURA"]);
          total_recaudado      = pay;
          total_en_cartera     = (total_facturado - pay);
				  $("#add_pago_fac").append($('<option>', {
					   value: facturas_venta[i]["ID"],
					   text : "#"+facturas_venta[i]["NUMERACION"]+" "+cliente["NOMBRE"]+", DEBE: ("+total_en_cartera+")"
				  }));
        }
      }
      //DECLARAR SELECT
      $('#add_pago_fac').selectpicker({ liveSearch:true });
    }
    function sync_items(){

      //* COMPROBAR ITEMS
      if(SYNC_ITEMS.length == 0){
        $("#sync").html('<i class="fa fa-refresh"></i>&nbsp;Sincronizar<span class="badge badge-light" id="can_syncs">0</span>');
        alert("Los datos se han Sincronizado con éxito");
        return;
      }

      //* AGREGAR FACTURA
      if( SYNC_ITEMS[0]["FACTURA"]["FACTURA"] != null ){

        //1 GUARDAR FACTURA
        send_(
          SYNC_ITEMS[0]["FACTURA"]["FAC_URL"],
          SYNC_ITEMS[0]["FACTURA"]["FAC_DAT"]
        ).then(
          (resp)=>{

            if(SYNC_ITEMS[0]["FACTURA"]["PAGO"] != null){

              //2 GUADAR PAGO
              SYNC_ITEMS[0]["FACTURA"]["PAGO"]["_ID_FACTURA_VENTA"] = resp["ID"];
              SYNC_ITEMS[0]["FACTURA"]["PAG_DAT"] = 'TABLE=MOVIMIENTOS_BANCOS'+'&ROWS='+JSON.stringify([SYNC_ITEMS[0]["FACTURA"]["PAGO"]])

              send_(
                SYNC_ITEMS[0]["FACTURA"]["PAG_URL"],
                SYNC_ITEMS[0]["FACTURA"]["PAG_DAT"]
              ).then(
                (resp)=>{

                  //3 NUEVO LLAMADO
                  setTimeout(()=>{
                    SYNC_ITEMS.splice(0,1);
                    localStorage.setItem("SYNC_ITEMS", JSON.stringify(SYNC_ITEMS));
                    $("#can_syncs").html(SYNC_ITEMS.length);
                    sync_items();
                  },2000);

                },
                (error)=>{ alert("Parece que hay problemas con el internet"); }
              );
            }else{

              //3 NUEVO LLAMADO
              setTimeout(()=>{
                SYNC_ITEMS.splice(0,1);
                localStorage.setItem("SYNC_ITEMS", JSON.stringify(SYNC_ITEMS));
                $("#can_syncs").html(SYNC_ITEMS.length);
                sync_items();
              },500);

            }

          },
          (error)=>{ 
            alert("Parece que hay problemas con el internet"); 
          }
        );
      }

      //* AGREGAR PAGO
      if( SYNC_ITEMS[0]["PAGO"]["PAGO"] != null ){

        //1 GUARDAR FACTURA
        send_(
          SYNC_ITEMS[0]["PAGO"]["PAG_URL"],
          SYNC_ITEMS[0]["PAGO"]["PAG_DAT"]
        ).then(
          (resp)=>{

            //ACTUALIZAR DATOS DE PAGO
            send_(
              SYNC_ITEMS[0]["UPDATE"]["UPD_URL"],
              SYNC_ITEMS[0]["UPDATE"]["UPD_DAT"]
            );

            //2 NUEVO LLAMADO
            setTimeout(()=>{
              SYNC_ITEMS.splice(0,1);
              localStorage.setItem("SYNC_ITEMS", JSON.stringify(SYNC_ITEMS));
              $("#can_syncs").html(SYNC_ITEMS.length);
              sync_items();
            },2000);

          },
          (error)=>{ alert("Parece que hay problemas con el internet"); }
        );

      }
    }
    function add_item(){
      var regex = new RegExp("\"", "g");
      var item_txt       = $("#fac_ven_obs option:selected").text().split("||")[0].replace(regex, "");
          item_txt       = item_txt.replace(/([\ \t]+(?=[\ \t])|^\s+|\s+$)/g, ''); //Quitar espacio indeceados y tabulaciones
          item_txt       = item_txt.replace("\n"," ");
      var _id_item       = $("#fac_ven_obs option:selected").val();

      var valor_unitario = 0; if ($("#fac_ven_vau").val() != "" ) { valor_unitario = parseInt($("#fac_ven_vau").val()); }
      var cantidad       = 0; if ($("#fac_ven_can").val() != "" ) { cantidad       = parseInt($("#fac_ven_can").val()); }
      var descuento_por  = 0; if ($("#fac_ven_des").val() != "" ) { descuento_por  = parseInt($("#fac_ven_des").val()); }
      var descuento_val  = 0; if ($("#fac_ven_dev").val() != "" ) { descuento_val  = parseInt($("#fac_ven_dev").val()); }
      var subtotal       = valor_unitario * cantidad;

      //Descuento
      if(descuento_val > 0) subtotal = subtotal - descuento_val;
      else                  subtotal = subtotal - (subtotal * (descuento_por/100));
      var base_gravable  =  subtotal;

      //Impuesto
      var por_impuesto   = parseInt($("#fac_ven_imp option:selected").val());
      var tipo_impuesto  = $("#fac_ven_imp option:selected").text().split(" ");
      var impuesto       = $("#fac_ven_imp option:selected").text();
      if (por_impuesto < 10) { var factor_divisor = parseFloat( "1.0"+por_impuesto); }
      else{ var factor_divisor = parseFloat( "1."+por_impuesto); }
      var total          = parseInt(base_gravable * factor_divisor);
      var res_impuesto   = total - base_gravable;

      //Almacenar variables
      items.push({
          "ITEM"             :item_txt,
          "_ID_ITEM"         :_id_item,
          "PRECIO_COSTO_TOTAL":(parseInt($("#fac_ven_cos").val())*cantidad ),
          "VALOR_UNITARIO"   :valor_unitario,
          "CANTIDAD"         :cantidad,
          "DESCUENTO_POR"    :descuento_por,
          "DESCUENTO_VAL"    :descuento_val,
          "IMPUESTO"         :impuesto,
          "BASE_GRAVABLE"    :base_gravable,
          "POR_IMPUESTO"     :por_impuesto,
          "TOTAL_IMPUESTO"   :res_impuesto,
          "TOTAL"            :total,
          "PRODUCTO"         :0
      });

      BuildTableItems();
      $("#fac_ven_obs").selectpicker('val', "0");
      $("#fac_ven_vau").val("");
      $("#fac_ven_dev").val("");
      $("#fac_ven_bas").val("");
      $("#fac_ven_cos").val("");
      $("#fac_ven_imp").val("");
      $("#fac_ven_tim").val("");
      $("#fac_ven_rap").val("");
    }
    function add_baja(){
      var regex = new RegExp("\"", "g");
      var item_txt       = $("#fac_ven_obs option:selected").text().replace(regex, "");
          item_txt       = item_txt.replace(/([\ \t]+(?=[\ \t])|^\s+|\s+$)/g, ''); //Quitar espacio indeceados y tabulaciones
          item_txt       = item_txt.replace("\n"," ");
          item_txt      += " (Baja por devolución, LOTE:"+$("#lote_item").val()+")";
      var _id_item       = $("#fac_ven_obs option:selected").val();
      $("#loteBajaModal").modal("hide");


      var cantidad       = 0; if ($("#fac_ven_can").val() != "" ) { cantidad = parseInt($("#fac_ven_can").val()); }

      //Almacenar variables
      items.push({
          "ITEM"             :item_txt,
          "_ID_ITEM"         :_id_item,
          "PRECIO_COSTO_TOTAL":(parseInt($("#fac_ven_cos").val())*cantidad ),
          "VALOR_UNITARIO"   :0,
          "CANTIDAD"         :cantidad,
          "DESCUENTO_POR"    :0,
          "DESCUENTO_VAL"    :0,
          "IMPUESTO"         :0,
          "BASE_GRAVABLE"    :0,
          "POR_IMPUESTO"     :0,
          "TOTAL_IMPUESTO"   :0,
          "TOTAL"            :0,
          "PRODUCTO"         :0
      });

      BuildTableItems();
      $("#fac_ven_obs").selectpicker('val', "0");
      $("#fac_ven_vau").val("");
      $("#fac_ven_dev").val("");
      $("#fac_ven_bas").val("");
      $("#fac_ven_cos").val("");
      $("#fac_ven_imp").val("");
      $("#fac_ven_tim").val("");
      $("#fac_ven_rap").val("");
    }
    function cal_item_otr(){

      var regex = new RegExp("\"", "g");
      var item_txt       = $("#fac_ven_obs option:selected").val().replace(regex, "");
          item_txt       = item_txt.replace(/([\ \t]+(?=[\ \t])|^\s+|\s+$)/g, ''); //Quitar espacio indeceados y tabulaciones
          item_txt       = item_txt.replace("\n"," ");

      var valor_unitario = 0; if ($("#fac_ven_vau").val() != "" ) { valor_unitario = parseInt($("#fac_ven_vau").val()); }
      var cantidad       = 0; if ($("#fac_ven_can").val() != "" ) { cantidad       = parseInt($("#fac_ven_can").val()); }
      var descuento_por  = 0; if ($("#fac_ven_des").val() != "" ) { descuento_por  = parseInt($("#fac_ven_des").val()); }
      var descuento_val  = 0; if ($("#fac_ven_dev").val() != "" ) { descuento_val  = parseInt($("#fac_ven_dev").val()); }
      var subtotal       = valor_unitario * cantidad;

      //Descuento
      if(descuento_val > 0) subtotal = subtotal - descuento_val;
      else                  subtotal = subtotal - (subtotal * (descuento_por/100));
      var base_gravable  =  subtotal;

      //Impuesto
      var por_impuesto   = parseInt($("#fac_ven_imp option:selected").val());
      var tipo_impuesto  = $("#fac_ven_imp option:selected").text().split(" ");
      var impuesto       = $("#fac_ven_imp option:selected").text();
      if (por_impuesto < 10) { var factor_divisor = parseFloat( "1.0"+por_impuesto); }
      else{ var factor_divisor = parseFloat( "1."+por_impuesto); }
      var total          = parseInt(base_gravable * factor_divisor);
      var res_impuesto   = total - base_gravable;

      $("#fac_ven_tim").val(res_impuesto);
      $("#fac_ven_bas").val(base_gravable);
      $("#val_otr_item").html("$ "+(total)+" COP");
    }
    function BuildTableItems(){

      var htmlTabla = "";
      var TOTAL_    = 0;
      var BASE_     = 0;
      var IMPUESTO_ = 0;
      var RETENIDO_ = 0;

      //AGREGAR ITEMS A LOS SELECT PARA APLICAR RETENCIÓN
      $('#fac_ven_lit option').each(function() { $(this).remove(); });
      $("#fac_ven_lit").append($('<option>', { value: '-1', text : "Toda la factura" }));

      //Lista de items
      for (var i=0; i<items.length; i++) {
        htmlTabla += ""+
        "<tr>"+
          "<td>" + items[i]["ITEM"] + "</td>" +
          "<td>" + fNumber.go(parseInt(items[i]["VALOR_UNITARIO"]), "$") + "</td>" +
          "<td>" + items[i]["CANTIDAD"] + "</td>" +
          "<td>" + fNumber.go(parseInt(items[i]["TOTAL"]), "$") + "</td>" +
          "<td align='center' style='color:#f00;'>"+
            "<button type='button' class='btn btn-outline-danger btn-circle cl_item_del' alt='"+i+"'><i class='material-icons'>clear</i></button>"+
          "</td>"+
        "</tr>";

        TOTAL_    += parseInt(items[i]["TOTAL"]);
        BASE_     += parseInt(items[i]["BASE_GRAVABLE"]);
        IMPUESTO_ += parseInt(items[i]["TOTAL_IMPUESTO"]);

        //AGREGAR ITEMS A LOS SELECT PARA APLICAR RETENCIÓN
        $("#fac_ven_lit").append($('<option>', { value: i, text : items[i]["ITEM"] }));

      }

      //Total Base Gravable
      htmlTabla += ""+
        "<tr>"+
          "<td></td>" +
          "<td></td>" +
          "<td><strong> BASE </strong></td>" +
          "<td align='right'> " + fNumber.go((BASE_ ), "$") + "</td>" +
          "<td></td>"+
        "</tr>";
      //Total impuesto
      htmlTabla += ""+
        "<tr>"+
          "<td></td>" +
          "<td></td>" +
          "<td><strong> IMPUESTO </strong></td>" +
          "<td align='right'> " + fNumber.go((IMPUESTO_ ), "$") + "</td>" +
          "<td></td>"+
        "</tr>";
      //Total
      htmlTabla += ""+
        "<tr>"+
          "<td></td>" +
          "<td></td>" +
          "<td><strong> TOTAL </strong></td>" +
          "<td align='right'> " + fNumber.go((TOTAL_ ), "$") + "</td>" +
          "<td></td>"+
        "</tr>";

      TOTAL_FACTURA = (TOTAL_ - RETENIDO_);
      $("#can_items").html(items.length);
      $("#fac_ven_tot").val(TOTAL_FACTURA);
      $("#items_table_html").html(htmlTabla);
    }
    function BuildTableRetencionesItem(){
      var RETENCIONES  = 0;
      var htmlTabla = "";

        //RETENCIONES
        for (var i=0; i<itemsRetenciones.length; i++) {
          htmlTabla += ""+
          "<tr>"+
            "<td>" + itemsRetenciones[i]["NOMBRE"] + "</td>" +
            "<td align='right'>-" + fNumber.go(parseInt(itemsRetenciones[i]["VAL_RETENIDO"]), "$") + "</td>" +
            "<td align='center' style='color:#f00;'>"+
              "<button type='button' class='btn btn-outline-danger btn-circle cl_item_r_del' alt='"+i+"'><i class='material-icons'>clear</i></button>"+
            "</td>"+
          "</tr>";
          RETENCIONES += parseInt(itemsRetenciones[i]["VAL_RETENIDO"]);
        }
        //TOTAL
        htmlTabla += "<tr><td>TOTAL RETENIDO:</td><td align='right'>" + fNumber.go((RETENCIONES), "$") + "</td><td></td></tr>";
        $("#items_retenciones_table_html").html(htmlTabla);
    }
    function getNextNumberFac(DIAN){
      //Obtener la numeración que sigue en facturación
      return new Promise(function(resolve, reject) {
        var mayor_numero = 0;
        for (var i = facturas_venta.length - 1; i >= 0; i--){
          if (DIAN == 1 && parseInt(facturas_venta[i]["DIAN"])==1){
            if(parseInt(facturas_venta[i]["NUMERACION"].split("-")[1]) > mayor_numero )
              mayor_numero = parseInt(facturas_venta[i]["NUMERACION"].split("-")[1]);
          }
          if (DIAN == 0 && parseInt(facturas_venta[i]["DIAN"])==0){
            if(parseInt(facturas_venta[i]["NUMERACION"].split("-")[1]) > mayor_numero )
              mayor_numero = parseInt(facturas_venta[i]["NUMERACION"].split("-")[1]);
          }
        }
        resolve(mayor_numero);
      });
    }
    function getNextNumberRec(){
      //Obtener la numeración que sigue en recibos
      return new Promise(function(resolve, reject) {
        var mayor_numero = 0;
        for (var i = movimientos_bancos.length - 1; i >= 0; i--) {
          if (
                movimientos_bancos[i]["_ID_USUARIO"]==$("#usuario").attr("alt") &&
                movimientos_bancos[i]["DEBITO"]>0
            ){
            if(parseInt(movimientos_bancos[i]["NUMERACION"].split("-")[1]) > mayor_numero )
              mayor_numero = parseInt(movimientos_bancos[i]["NUMERACION"].split("-")[1]);
          }
        }
        resolve(mayor_numero);
      });
    }
    function getNextNumberGas(){
      //Obtener la numeración que sigue en recibos
      return new Promise(function(resolve, reject) {
        var mayor_numero = 0;
        for (var i = movimientos_bancos.length - 1; i >= 0; i--) {
          if (
                movimientos_bancos[i]["_ID_USUARIO"]==$("#usuario").attr("alt") &&
                movimientos_bancos[i]["CREDITO"]>0
            ){
            if(parseInt(movimientos_bancos[i]["NUMERACION"].split("-")[1]) > mayor_numero )
              mayor_numero = parseInt(movimientos_bancos[i]["NUMERACION"].split("-")[1]);
          }
        }
        resolve(mayor_numero);
      });
    }
    function restarCantidades(itemsCopia){
        for (var i = itemsCopia.length - 1; i >= 0; i--) {
            for (var c = cantidades_bodega.length - 1; c >= 0; c--) {
                if(parseInt(itemsCopia[i]["_ID_ITEM"])==parseInt(cantidades_bodega[c]["_ID_ITEM"])){
                  cantidades_bodega[c]["STOCK"] = parseInt(cantidades_bodega[c]["STOCK"])-parseInt(itemsCopia[i]["CANTIDAD"]);
                }
            }
        }
        buildSelectItems();
    }
    function createNewFac(){
      //Crear una factura nueva
      //Validar que hayan items cargados y que haya un cliente seleccionado
      if (validateData()) {

        //1RA PARTE - CONSULTAR NUMERACIÓN
        $("#btn_save_factura").html('<i class="fa fa-refresh fa-spin"></i>&nbsp;FACTURAR');
        var DIAN  = ($("#dian").is(":checked"))?1:0;
        getNextNumberFac(DIAN).then(
          (next)=>{
            getNextNumberRec().then(
              (next_rec)=>{
                  
                var itemscopia = JSON.parse(JSON.stringify(items));
                restarCantidades(itemscopia);

                //INFORMCIÓN DEL PAGO
                var PAGO = {
                  'FORMA_PAGO_ID' :$("#fac_ven_met option:selected").val(),
                  'FORMA_PAGO_TXT':$("#fac_ven_met option:selected").text(),
                  'RECIBIDO'      :$("#fac_ven_tre").val(),
                  'CAMBIO'        :$("#fac_ven_cam").val()
                };

                //FACTURA
                var PAGOS = [];
                let factura_array   = {
                    'ID'               :null,
                    '_ID_CLIENTE'      :$("#fac_cli_lis option:selected").val(),
                    '_ID_USUARIO'      :$("#usuario").attr("alt"),
                    'FECHA_HORA'       :$("#fac_ven_fec").val(),
                    'ITEMS'            :JSON.stringify(items),
                    '_ID_LISTA_PRECIOS':$("#fac_ven_lpe").val(),
                    'ESTADO'           :($("#fac_ven_tot").val()>=TOTAL_FACTURA)?1:0,
                    'RETENCIONES'      :JSON.stringify(itemsRetenciones),
                    'METODO_PAGO'      :$("#fac_ven_met option:selected").val(),
                    'VALOR_FACTURA'    :TOTAL_FACTURA,
                    'OBSERVACIONES'    :$("#fac_ven_obf").val(),
                    'COMENTARIOS'      :JSON.stringify(PAGO),
                    'DIAN'             :($("#dian").is(":checked"))?1:0,
                    'NUMERACION'       :zfill(parseInt($("#usuario").attr("alt")),3)+"-"+zfill((next+1),5),
                    'PAGO'             :JSON.stringify(PAGOS)
                };
       
                //PAGO O ABONO
                var pago_array   = null;
    
                if(parseInt($("#fac_ven_tot").val())>0){
                  pago_array = {
                    'ID'                 :null,
                    '_ID_BANCO'          :bancos_usuario[0]["_ID_BANCO"],
                    '_ID_USUARIO'        :$("#usuario").attr("alt"),
                    '_ID_CLIENTE'        :$("#fac_cli_lis option:selected").val(),
                    '_ID_PROVEEDOR'      :0,
                    '_ID_FACTURA_VENTA'  :0,
                    '_ID_FACTURA_COMPRA' :0,
                    '_ID_NOTA_DEBITO'    :0,
                    '_ID_NOTA_CREDITO'   :0,
                    '_ID_CATEGORIA_GASTO'  :0,
                    '_ID_CATEGORIA_INGRESO':$("#fac_ven_cat option:selected").val(),
                    'NUMERACION'         :zfill(parseInt($("#usuario").attr("alt")),3)+"-"+zfill((next_rec+1),5),
                    'METODO_PAGO'        :$("#fac_ven_met option:selected").val(),
                    'DEBITO'             :$("#fac_ven_tot").val(),
                    'CREDITO'            :0,
                    'PRODUCCION'         :0,
                    'DISTRIBUCION'       :0,
                    'FECHA_HORA'         :moment().format("YYYY-MM-DD hh:mm:ss"),
                    'OBSERVACIONES'      :$("#fac_ven_obf").val()
                  };
      
                }

                //AÑADIR ITEM
                var ITEM_SYNC = {
                	FACTURA:{
                		FACTURA :factura_array,
                    PAGO    :pago_array,
                	},
                  PAGO:{
                    PAGO    :null
                  },
                  GASTO:{
                    GASTO   :null,
                  }
                };

                //REGISTRAR EN EL STORAGE
                SYNC_ITEMS.push(ITEM_SYNC);
                localStorage.setItem("SYNC_ITEMS", JSON.stringify(SYNC_ITEMS));
                $("#can_syncs").html(SYNC_ITEMS.length);
                $("#btn_save_factura").html('<i class="fa fa-check" aria-hidden="true"></i>FACTURAR');
                //$("#btn_save_factura").attr("alt", resp["ID"]);
                print_invoice(factura_array);
                items = [];
                itemsRetenciones = [];
                TOTAL_FACTURA = 0;
                BuildTableItems();
                $("#can_items").html("0");
                $("#fac_cli_lis").selectpicker("val", "0");
                $("#fac_ven_obf").val("");
                $('#fac_ven_fec').val(moment().format("YYYY-MM-DD HH:mm A"));
                $("#btn_imprimir").attr("disabled", true);
                $("#pagoModal").modal("hide");
                $('#tab_facturas a[href="#TAB1"]').tab('show');
                facturas_venta.push(factura_array);
              }
            );
          }
        );
      }
    }
    function get_cliente(_ID_CLIENTE){
      for (var i = clientes.length - 1; i >= 0; i--) {
        if (clientes[i]["ID"]==_ID_CLIENTE) {
          return clientes[i];
        }
      }
      return {
        "NOMBRE":"(Cliente eliminado)",
        "DOCUMENTO_NIT":"0",
        "TIPO_DOCUMENTO":"N/A",
        "EMAIL":"",
        "CELULAR":"",
      };
    }
    function get_vendedor(_ID_VENDEDOR){
      for (var i = usuarios.length - 1; i >= 0; i--) {
        if (usuarios[i]["ID"]==_ID_VENDEDOR) {
          return usuarios[i];
        }
      }
    }
    function get_resolucion(_ID_VENDEDOR, DIAN, NUMERACION){
      for (var i = resoluciones.length - 1; i >= 0; i--) {
          if (
            DIAN == 1 &&
            resoluciones[i]["_ID_USUARIO"]==_ID_VENDEDOR &&
            parseInt(resoluciones[i]["NUMERACION_HASTA"]) >= parseInt(NUMERACION.split("-")[1]) &&
            parseInt(resoluciones[i]["NUMERACION_DESDE"]) <= parseInt(NUMERACION.split("-")[1])
          ) {
              return  '<strong>'+'Resolución Dian N°'+resoluciones[i]["NUMERO_RESOLUCION"]+
                    ' Del '+resoluciones[i]["FECHA_RESOLUCION"]+'-'+resoluciones[i]["NUMERACION_DESDE"]+'<br>'+
                    ' Desde No. '+resoluciones[i]["PREFIJO_RESOLUCION"]+'-'+zfill(resoluciones[i]["NUMERACION_DESDE"], 5)+
                    ' al No. '+resoluciones[i]["PREFIJO_RESOLUCION"]+'-'+zfill(resoluciones[i]["NUMERACION_HASTA"], 5)+'</strong><br>';
          }
        }
        return '';
    }
    function print_invoice(factura){
      //VER DATOS DEL CLIENTE
      var cliente = get_cliente(factura["_ID_CLIENTE"]);
      var vendedor= get_vendedor(factura["_ID_USUARIO"]);
      //var resoluc = get_resolucion(vendedor["ID"], factura["DIAN"], factura["NUMERACION"]);
      var resoluc   = "";
      var items_  = JSON.parse(factura["ITEMS"]);
      var pago_   = JSON.parse(factura["COMENTARIOS"]);
      var nombre    = (cliente["NOMBRE"]!="")?'Nombre : '+cliente["NOMBRE"]+'</br>':'';
      var documento = (cliente["DOCUMENTO_NIT"]!="")?'Documento : '+cliente["TIPO_DOCUMENTO"]+" "+cliente["DOCUMENTO_NIT"]+'</br>':'';
      var email     = (cliente["EMAIL"]!="")?'Email &nbsp;: '+cliente["EMAIL"]+'</br>':'';
      var celular   = (cliente["CELULAR"]!="")?'Celular : '+cliente["CELULAR"]+'</br>':'';

      var tipo_documento = "REMISIÓN";
      if(parseInt(factura["DIAN"])==1) tipo_documento = "ORDEN DE ENTREGA";

      var invoice = ''+
          '<div id="invoice-POS">'+
            '<center id="top">'+
              '<div class="info-address">'+
                '<img src="http://productosalimenticiosarfor.com/app/images/logo.png" width="20%"><br>'+
                '<span>Productos Alimenticios<br> ARFOR</span>'+
                '<p style="margin-top: 3px;">'+
                    'Cra 7A N8a-33 Br. Arbelaez, FACATATIVÁ</br>'+
                    'Regimen Común, NIT. 900316147-6</br>'+
                    '<strong>'+tipo_documento+': #'+factura["NUMERACION"]+'</strong></br>'+
                '</p>'+
              '</div>'+
            '</center><!--End InvoiceTop-->'+
            '<div id="mid">'+
              '<div class="info">'+
                '<h2>CLIENTE</h2>'+
                '<p style="margin-top: -3px;"> '+
                  nombre+
                  documento+
                  email+
                  celular+
                  'Fecha : '+factura["FECHA_HORA"]+'</br>'+
                '</p>'+
              '</div>'+
            '</div><!--End Invoice Mid-->'+
          '<div id="bot">'+
            '<div id="table">'+
              '<table>'+
                '<tr class="tabletitle">'+
                  '<td class="hours"><h2>Cant</h2></td>'+
                    '<td class="item"><h2>Item</h2></td>'+
                    '<td class="rate" align="right"><h2>Val_unit</h2></td>'+
                    '<td class="rate" align="right"><h2>Desc</h2></td>'+
                    '<td class="rate" align="right"><h2>Subtotal</h2></td>'+
                '</tr>';

                //ITEMS
                var base_val       = 0;
                var impuesto_val   = 0;
                var impuesto_nom   = 0;
                var iva_19         = 0;
                var iva_5          = 0;
                var total_sin_desc = 0;
                var total_desc     = 0;

                for (var i = items_.length - 1; i >= 0; i--) {

                  var DESCUENTO = "0";
                  total_sin_desc += (parseInt(items_[i]["CANTIDAD"])*parseInt(items_[i]["VALOR_UNITARIO"]));
                  if (parseInt(items_[i]["DESCUENTO_POR"])>0){
                    if(parseInt(items_[i]["DESCUENTO_POR"])<10){
                      DESCUENTO   = parseInt(parseFloat("0.0"+items_[i]["DESCUENTO_POR"])*parseInt(items_[i]["VALOR_UNITARIO"]))*parseInt(items_[i]["CANTIDAD"]);
                      total_desc += DESCUENTO;
                    }else{
                      DESCUENTO =   parseInt(parseFloat("0."+items_[i]["DESCUENTO_POR"])*parseInt(items_[i]["VALOR_UNITARIO"]))*parseInt(items_[i]["CANTIDAD"]);
                      total_desc += DESCUENTO;
                    }
                  }else{
                    if (items_[i]["DESCUENTO_VAL"]>0){
                      DESCUENTO   = parseInt(items_[i]["DESCUENTO_VAL"])*parseInt(items_[i]["CANTIDAD"]);
                      total_desc += DESCUENTO;
                    }
                  }


                  invoice += ''+
                  '<tr class="tabletitle">'+
                    '<td class="hours">'+items_[i]["CANTIDAD"]+'</td>'+
                    '<td class="item">'+items_[i]["ITEM"]+'</td>'+
                    '<td class="rate" align="right">'+items_[i]["VALOR_UNITARIO"]+'</td>'+
                    '<td class="rate" align="right">'+DESCUENTO+'</td>'+
                    '<td class="rate" align="right">'+items_[i]["TOTAL"]+'</td>'+
                  '</tr>';

                  base_val     += parseInt(items_[i]["BASE_GRAVABLE"]);
                  if(parseInt(items_[i]["POR_IMPUESTO"]) == 19 ) iva_19 += parseInt(items_[i]["TOTAL_IMPUESTO"]);
                  if(parseInt(items_[i]["POR_IMPUESTO"]) == 5 ) iva_5   += parseInt(items_[i]["TOTAL_IMPUESTO"]);
                }

                //BASE GRABABLE
                invoice += ''+
              '</table>'+
              '<table>'+
                '<tr class="tabletitle"><td colspan="2">[INFORMACIÓN TRIBUTARIA]</td></tr>'+
                '<tr class="tabletitle"><td>SUBTOTAL:</td><td align="right">'+total_sin_desc+'</td></tr>'+
                '<tr class="tabletitle"><td>DESCUENTO:</td><td align="right">'+total_desc+'</td></tr>'+
                '<tr class="tabletitle"><td>BASE GRAVABLE:</td><td align="right">'+base_val+'</td></tr>'+
                '<tr class="tabletitle"><td>IVA 19%:</td><td align="right">'+iva_19+'</td></tr>'+
                '<tr class="tabletitle"><td>IVA 5%:</td><td align="right">'+iva_5+'</td></tr>'+
              '</table>'+
              '<h2 style="float:right">TOTAL: '+factura["VALOR_FACTURA"]+'</h2>'+
              '<table>'+
                '<tr class="tabletitle"><td>FORMA DE PAGO:</td><td align="right">'+pago_["FORMA_PAGO_TXT"]+'</td></tr>'+
                '<tr class="tabletitle"><td>RECIBIDO:</td><td align="right">'+pago_["RECIBIDO"]+'</td></tr>'+
                '<tr class="tabletitle"><td>CAMBIO:</td><td align="right">'+pago_["CAMBIO"]+'</td></tr>'+
              '</table>'+
              '<br>'+'<br>'+
              '<table>'+
                '<tr class="tabletitle">'+
                  '<td align="center">'+
                    '<hr style="width:80%">'+
                    'FIRMA RECIBIDO CLIENTE'+
                  '</td>'+
                '</tr>'+
              '</table>'+
            '</div><!--End Table-->'+
            '<center id="legalcopy">'+
              '<p class="legal" style="margin-top: -2px;">'+
                '<strong>Vendedor:</strong>'+vendedor["NOMBRE"]+'<br>Cel:'+vendedor["CELULAR"]+'<br>'+
                resoluc+
                '<strong>productosalimenticiosarfor.com</strong>'+'<br>'+
                'productosalimenticiosarfor@gmail.com'+'<br>'+
                '¡¡GRACIAS POR SU COMPRA!!'+
              '</p>'+
            '</center>'+
          '</div><!--End InvoiceBot-->'+
        '</div><!--End Invoice-->'+

        //CSS
        '<style type="text/css">'+
          '#invoice-POS{margin:0 auto;width:100%;background:#fff;font-family:Sans-serif}h1{font-size:1.5em;color:#000}h2{font-size:.9em; margin-block-start:3px; margin-block-end:10px;}h3{font-size:1.2em;font-weight:300;line-height:2em}p{font-size:.6em;color:#000;line-height:1.2em}#bot,#mid,#top{min-height:150px;padding-top:2px}#mid{min-height:60px}#bot{min-height:50px}#top .logo{height:60px;width:60px;background-size:60px 60px}.clientlogo{float:left;height:60px;width:60px;background:url(http://michaeltruong.ca/images/client.jpg) no-repeat;background-size:60px 60px;border-radius:50px}.info-address{display:block;float:left;width:100%;margin-left:0}.info-logo{display:block;float:left;width:40%;margin-left:0}.title{float:right}.title p{text-align:right}table{width:100%;border-collapse:collapse}.tabletitle{font-size:.6em;background:#eee}.service{border-bottom:1px solid #eee}.item{width:auto}.hours{width:auto}.rate{width:auto}.itemtext{font-size:.6em}#legalcopy{margin-top:10px}'+
        '</style>';

        var mywindow = window.open();
        mywindow.document.write(invoice);
        //mywindow.document.close();
        mywindow.print();
        //mywindow.close();
    }
    function validateData(){
      //Validar datos
      if($("#fac_ven_fec").val() == ""){ message_('<i class="fa fa-times"></i>','Error','No has especificado la fecha de factura','error'); return false; }
      if($("#fac_cli_lis").val() == ""){ message_('<i class="fa fa-times"></i>','Error','No has seleccionado un cliente','error'); return false; }
      if(items.length == 0){ message_('<i class="fa fa-times"></i>','Error','No has agregado items a la factura','error'); return false; }
      if(editTable==false && parseInt($("#fac_ven_tot").val()) > 0 && $("#fac_ven_cue option:selected").val()=="0"){ message_('<i class="fa fa-times"></i>','Error','Especifica en la sección PAGO una cuenta destino','error'); return false; }
      return true;
    }
    function get_stock(_ID_ITEM){
      var stock = 0;
      for (var i=0; i<cantidades_bodega.length; i++) {
        if(cantidades_bodega[i]["_ID_ITEM"]==_ID_ITEM) {
          stock += parseInt(cantidades_bodega[i]["STOCK"]);
        }
      }
      return stock;
    }
    async function buildSelectItems(){
        $("#fac_ven_obs").selectpicker('destroy', true);
        $('#fac_ven_obs option').each(function() { $(this).remove(); });
        $("#fac_ven_obs").append($('<option>', { value: 0, text : "Selecciona un producto.." }));
        for (var i=0; i<inventario.length; i++) {
            //data.push({id:(i+1), name: inventario[i]["NOMBRE"]});
            $("#fac_ven_obs").append($('<option>', { value: inventario[i]["ID"], text : inventario[i]["NOMBRE"]+ " [REF:"+inventario[i]["REFERENCIA"]+"]" +" || STOCK: "+get_stock(inventario[i]["ID"]) }));
        }
        $("#fac_ven_obs").selectpicker({ liveSearch:true });
    }
    async function get_price(){
      //encontrar el precio del item
      if( parseInt( $("#fac_cli_lis option:selected").val() ) == 0 ){ 
        //$("#fac_ven_obs").selectpicker('val', '0');
        message_('<i class="fa fa-times"></i>','Oops!','Debes seleccionar un cliente primero','error');
        return false; 
      }

      var _ID_ITEM  = parseInt($("#fac_ven_obs option:selected").val());
      var _ID_LISTA = parseInt($("#fac_ven_lpe").val());
      var key       = false;

      for (var j = precios.length - 1; j >= 0; j--){
        //PRECIO DE LA LISTA DE PRECIOS
        if(
          precios[j]["_ID_ITEM"]  == _ID_ITEM &&
          precios[j]["_ID_LISTA"] == _ID_LISTA
        ){
            $("#fac_ven_vau").val(precios[j]["PRECIO_VENTA"]); 
            $("#fac_ven_cos").val(precios[j]["PRECIO_COSTO"]);
            key = true;
        }
        //PRECIO POR DEFECTO DE BODEGA SIN HAYA UNO
        if(!key){
          $("#fac_ven_vau").val(0); 
          $("#fac_ven_cos").val(0);
        }
      }

    }
    function getPay(_ID_FAC_VENTA){
      var VALOR_PAGADO = 0;
      for (var i = 0; i < movimientos_bancos.length; i++) {
        if (movimientos_bancos[i]["_ID_FACTURA_VENTA"]==_ID_FAC_VENTA) {
          if (movimientos_bancos[i]["ID"]!=null) {
            VALOR_PAGADO+=movimientos_bancos[i]["DEBITO"];
          }
        }
      }
      for (var j = 0; j < SYNC_ITEMS.length; j++) {
        if (SYNC_ITEMS[j]["PAGO"]["PAGO"]!=null) {
          if (SYNC_ITEMS[j]["PAGO"]["PAGO"]["_ID_FACTURA_VENTA"]==_ID_FAC_VENTA) {
            VALOR_PAGADO+=parseInt(SYNC_ITEMS[j]["PAGO"]["PAGO"]["DEBITO"]);
          }
        }
      }
      if (VALOR_PAGADO < 0 ) return 0;
      else                   return VALOR_PAGADO;
    }


    //#######################
    // FUNCIONES DE CARGA 
    //#######################

    async function LoadFacturas(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;1/16 Cargando facturas");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=FACTURAS_VENTA'+
                     '&FIELDS='+JSON.stringify(['ID','_ID_CLIENTE','_ID_USUARIO','FECHA_HORA','ITEMS','_ID_LISTA_PRECIOS','ESTADO','RETENCIONES','METODO_PAGO','VALOR_FACTURA','OBSERVACIONES','COMENTARIOS','DIAN','NUMERACION','PAGO'])+
                     '&FILTER='+JSON.stringify([['_ID_USUARIO',$("#usuario").attr("alt"),'=']])+
                     '&GET_ALL=0';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
        	facturas_venta = resp;
        	PrepareFacturas();
          LoadClientes();
        },
        (error)=>{ 
          setTimeout(()=>{ LoadFacturas(); },1500) 
        }
      );
    }
    async function LoadClientes(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;2/16 Cargando clientes");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=CLIENTES'+
                     '&FIELDS='+JSON.stringify(['ID','NOMBRE','CELULAR','_ID_LISTA_PRECIOS','_ID_IMPUESTO','POR_DESCUENTO', 'TIPO_DOCUMENTO', 'DOCUMENTO_NIT', 'EMAIL','FACTURACION_DIAN'])+
                     '&FILTER='+JSON.stringify([])+
                     //'&FILTER='+JSON.stringify([['_ID_VENDEDOR',$("#usuario").attr("alt"),'=']])+
                     '&GET_ALL=0';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          clientes = resp;
          PrepareClientes();
          LoadUsuBancos(); 
        },(error)=>{ setTimeout(()=>{ LoadClientes(); },1500) }
      );
    }
    async function LoadUsuBancos(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;3/16 Cargando banco asignado al cliente");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=USUARIOS_BANCOS'+
                     '&FIELDS='+JSON.stringify(['ID','_ID_USUARIO','_ID_BANCO'])+
                     '&FILTER='+JSON.stringify([['_ID_USUARIO',$("#usuario").attr("alt"),'=']])+
                     '&GET_ALL=0';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          bancos_usuario = resp;
          LoadBancos();
        },
        (error)=>{ setTimeout(()=>{ LoadUsuBancos(); },1500) }
      );
    }
    async function LoadBancos(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;4/16 Cargando lista de bancos");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=BANCOS'+
                     '&FIELDS='+JSON.stringify(['ID','NOMBRE','NUMERO','TIPO','OBSERVACIONES'])+
                     '&FILTER=[]'+
                     '&GET_ALL=1';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          bancos = resp;
          PrepareBancos();
          LoadMovimientos();
        },(error)=>{ setTimeout(()=>{ LoadBancos(); },1500) }
      );
    }
    async function LoadMovimientos(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;5/16 Cargando registro de pagos");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=MOVIMIENTOS_BANCOS'+
                     '&FIELDS='+JSON.stringify(['ID','_ID_BANCO','_ID_USUARIO','_ID_CLIENTE','_ID_PROVEEDOR','_ID_FACTURA_VENTA','NUMERACION','METODO_PAGO','DEBITO','CREDITO'])+
                     '&FILTER='+JSON.stringify([])+
                     //'&FILTER='+JSON.stringify([['_ID_USUARIO',$("#usuario").attr("alt"),'=']])+
                     '&GET_ALL=0';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{  
          movimientos_bancos = resp; LoadCategoriasIng();
        },
        (error)=>{ setTimeout(()=>{ LoadMovimientos(); },1500) }
      );
    }
    async function LoadCategoriasIng(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;6/16 Cargando categorias de ingresos");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=CATEGORIAS_INGRESOS'+
                     '&FIELDS='+JSON.stringify(['ID','NOMBRE'])+
                     '&FILTER=[]'+
                     '&GET_ALL=1';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          categorias = resp;
          PrepareCategoriasIngreso();
          LoadCategoriasEgr();
        },
        (error)=>{ setTimeout(()=>{ LoadCategoriasIng(); },1500) }
      );
    }
    async function LoadCategoriasEgr(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;7/16 Cargando categorias de egresos");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=CATEGORIAS_GASTOS'+
                     '&FIELDS='+JSON.stringify(['ID','NOMBRE'])+
                     '&FILTER=[]'+
                     '&GET_ALL=1';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          categoriasE = resp;
          PrepareCategoriasEgreso();
          LoadListasPrec();
        },
        (error)=>{ setTimeout(()=>{ LoadCategoriasEgr(); },1500) }
      );
    }
    async function LoadListasPrec(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;8/16 Cargando lista de precios");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=INVENTARIO_LISTAS_PRECIOS'+'&FIELDS='+JSON.stringify(['ID','NOMBRE'])+'&FILTER=[]'+'&GET_ALL=1';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          listas_precios = resp;
          LoadPrecios();
        },
        (error)=>{ setTimeout(()=>{ LoadListasPrec(); },1500) }
      );
    }
    async function LoadPrecios(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;9/16 Cargando precios de items");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=INVENTARIO_PRECIO'+'&FIELDS='+JSON.stringify(['ID','_ID_ITEM','_ID_LISTA','PRECIO_COSTO','PRECIO_VENTA'])+'&FILTER=[]'+'&GET_ALL=1';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{  
          precios = resp; LoadUsuarios();
        },
        (error)=>{ setTimeout(()=>{ LoadPrecios(); },1500) }
      );
    }
    async function LoadUsuarios(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;10/16 Cargando información del vendedor");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=USUARIOS'+'&FIELDS='+JSON.stringify(['ID','NOMBRE','CELULAR'])+'&FILTER=[]'+'&GET_ALL=1';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          usuarios = resp;
          LoadImpuestos();},
        (error)=>{ setTimeout(()=>{ LoadUsuarios(); },1500) }
      );
    }
    async function LoadImpuestos(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;11/16 Cargando lista de impuestos");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=IMPUESTOS'+'&FIELDS='+JSON.stringify(['ID','NOMBRE','TIPO','PORCENTAJE','DESCRIPCION'])+'&FILTER=[]'+'&GET_ALL=1';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          impuestos = resp;
          PrepareImpuestos();
          LoadRetenciones();
        },(error)=>{ setTimeout(()=>{ LoadImpuestos(); },1500) }
      );
    }
    async function LoadRetenciones(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;12/16 Cargando lista de retenciones");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=RETENCIONES'+'&FIELDS='+JSON.stringify(['ID','NOMBRE','TIPO','PORCENTAJE','DESCRIPCION'])+'&FILTER=[]'+'&GET_ALL=1';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          retenciones = resp;
          PrepareRetenciones();
          LoadInventario();},
        (error)=>{ setTimeout(()=>{ LoadRetenciones(); },1500) }
      );
    }
    async function LoadInventario(){
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;13/16 Cargando items de venta");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=INVENTARIO_ITEMS'+'&FIELDS='+JSON.stringify(['ID','NOMBRE','REFERENCIA','PRECIO'])+'&FILTER=[]'+'&GET_ALL=1';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          inventario = resp;
          PrepareInventario();
          LoadUsuBodegas();
        },
        (error)=>{ setTimeout(()=>{ LoadInventario(); },1500) }
      );
    }
    async function LoadUsuBodegas(){
      //Bancos usuarios
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;14/16 Cargando bodega asignada al vendedor");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=USUARIOS_BODEGAS'+
                     '&FIELDS='+JSON.stringify(['ID','_ID_USUARIO','_ID_BODEGA'])+
                     '&FILTER='+JSON.stringify([['_ID_USUARIO',$("#usuario").attr("alt"),'=']])+
                     '&GET_ALL=0';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          if(resp.length > 0) {
            _ID_BODEGA_USUARIO = resp[0]["_ID_BODEGA"];
            LoadCantidades(_ID_BODEGA_USUARIO);
          }else{
            $("#LoadingModal").modal("hide");
            message_('','Oops!','Este usuario no tiene asignada una bodega','error');
          }
        },
        (error)=>{ setTimeout(()=>{ LoadUsuBodegas(); },1500) }
      );
    }
    async function LoadCantidades(_ID_BODEGA){
      //Cantidades de bodega
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;15/16 Cargando resoluciones DIAN");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=INVENTARIO_CANTIDADES'+
                     '&FIELDS='+JSON.stringify(['ID','_ID_BODEGA','_ID_ITEM','STOCK'])+
                     '&FILTER='+JSON.stringify([
                         ["_ID_BODEGA",_ID_BODEGA,"="],
                         ["STOCK",0,">"]
                     ])+
                     '&GET_ALL=0';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
          cantidades_bodega = resp;
          buildSelectItems();
          LoadResoluciones();
        },
        (error)=>{ setTimeout(()=>{ LoadCantidades(); },1500) }
      );
    }
    async function LoadResoluciones(){
      //Función para cargar la lista de resoluciones
      //Parametros Ajax
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp;16/16 Cargando resoluciones DIAN");
      let destino_ = "php/api/get.php";
      let data_    = 'TABLE=RESOLUCIONES_DIAN'+'&FIELDS='+JSON.stringify(['ID','NUMERO_RESOLUCION','FECHA_RESOLUCION','PREFIJO_RESOLUCION','NUMERACION_DESDE','NUMERACION_HASTA','_ID_USUARIO'])+'&FILTER=[]'+'&GET_ALL=1';
      //Procesando solicitud
      await send_(destino_, data_).then(
        (resp)=>{
        	resoluciones = resp;
        	$("#data_sync").html("...DATOS CARGADOS CORRECTAMENTE...");
          setTimeout(()=>{
            $("#LoadingModal").modal("hide");
            BuildSelectCartera();
            setDataStorage();
          },500);
        },
        (error)=>{
        	setTimeout(()=>{ LoadResoluciones(); },1500);
        }
      );
    }
    
    $("#add_pago_fac").change(function (){ 
        
      var VALOR_FACTURA = 0;
      var ABONOS = 0;
        
      for (var i = facturas_venta.length - 1; i >= 0; i--) {
        if (facturas_venta[i]["ID"]==$("#add_pago_fac option:selected").val() ){
          VALOR_FACTURA = parseInt(facturas_venta[i]["VALOR_FACTURA"]);
          $("#add_pago_obs").val("PAGO FACTURA DE VENTA #"+facturas_venta[i]["NUMERACION"]);
          for (var b = movimientos_bancos.length - 1; b >= 0; b--) {
            if (movimientos_bancos[b]["_ID_FACTURA_VENTA"]==$("#add_pago_fac option:selected").val() ){
              ABONOS = parseInt(movimientos_bancos[b]["DEBITO"]);
            }
          }
        }
      }  
      $("#add_pago_abo").val( (VALOR_FACTURA - ABONOS) );
    });
    
    //#######################
    // FUNCIONES ESTANDAR
    //#######################

    //Guardar copia local
    async function removeDataStorage(){

      localStorage.removeItem("facturasventa");
      localStorage.removeItem("clientes");
      localStorage.removeItem("bancosusuario");
      localStorage.removeItem("bancos");
      localStorage.removeItem("movimientosbancos");
      localStorage.removeItem("categorias");
      localStorage.removeItem("categoriase");
      localStorage.removeItem("listasprecios");
      localStorage.removeItem("precios");
      localStorage.removeItem("usuarios");
      localStorage.removeItem("impuestos");
      localStorage.removeItem("retenciones");
      localStorage.removeItem("inventario");
      localStorage.removeItem("IDBODEGAUSUARIO");
      localStorage.removeItem("cantidadesbodega");
      localStorage.removeItem("resoluciones");
      localStorage.removeItem("IDUSUARIO");
      window.location.href = "login.html";

    }
    async function setDataStorage(){

      localStorage.setItem("facturasventa", JSON.stringify(facturas_venta));
      localStorage.setItem("clientes", JSON.stringify(clientes));
      localStorage.setItem("bancosusuario", JSON.stringify(bancos_usuario));
      localStorage.setItem("bancos", JSON.stringify(bancos));
      localStorage.setItem("movimientosbancos", JSON.stringify(movimientos_bancos));
      localStorage.setItem("categorias", JSON.stringify(categorias));
      localStorage.setItem("categoriase", JSON.stringify(categoriasE));
      localStorage.setItem("listasprecios", JSON.stringify(listas_precios));
      localStorage.setItem("precios", JSON.stringify(precios));
      localStorage.setItem("usuarios", JSON.stringify(usuarios));
      localStorage.setItem("impuestos", JSON.stringify(impuestos));
      localStorage.setItem("retenciones", JSON.stringify(retenciones));
      localStorage.setItem("inventario", JSON.stringify(inventario));
      localStorage.setItem("IDBODEGAUSUARIO", JSON.stringify(_ID_BODEGA_USUARIO));
      localStorage.setItem("cantidadesbodega", JSON.stringify(cantidades_bodega));
      localStorage.setItem("resoluciones", JSON.stringify(resoluciones));

    }
    async function getDataFromStorage(){

      var flagToLoad = false;
      $("#LoadingModal").modal("show");
      $("#data_sync").html("<i class='fa fa-refresh fa-spin'></i>&nbsp; Cargando datos..");

      //Recuperar datos
      facturas_venta     = []; if(localStorage.getItem("facturasventa") != null){ facturas_venta = JSON.parse(localStorage.getItem("facturasventa")); }else{ flagToLoad = true; }
      clientes           = []; if(localStorage.getItem("clientes") != null){ clientes = JSON.parse(localStorage.getItem("clientes")); }else{ flagToLoad = true; }
      bancos_usuario     = []; if(localStorage.getItem("bancosusuario") != null){ bancos_usuario = JSON.parse(localStorage.getItem("bancosusuario")); }else{ flagToLoad = true;  }
      bancos             = []; if(localStorage.getItem("bancos") != null){ bancos = JSON.parse(localStorage.getItem("bancos")); }else{ flagToLoad = true; }
      movimientos_bancos = []; if(localStorage.getItem("movimientosbancos") != null){ movimientos_bancos = JSON.parse(localStorage.getItem("movimientosbancos")); }else{ flagToLoad = true; }
      categorias         = []; if(localStorage.getItem("categorias") != null){ categorias = JSON.parse(localStorage.getItem("categorias")); }else{ flagToLoad = true; }
      categoriasE        = []; if(localStorage.getItem("categoriase") != null){ categoriasE = JSON.parse(localStorage.getItem("categoriase")); }else{ flagToLoad = true; }
      listas_precios     = []; if(localStorage.getItem("listasprecios") != null){ listas_precios = JSON.parse(localStorage.getItem("listasprecios")); }else{ flagToLoad = true; }
      precios            = []; if(localStorage.getItem("precios") != null){ precios = JSON.parse(localStorage.getItem("precios")); }else{ flagToLoad = true; }
      usuarios           = []; if(localStorage.getItem("usuarios") != null){ usuarios = JSON.parse(localStorage.getItem("usuarios")); }else{ flagToLoad = true; }
      impuestos          = []; if(localStorage.getItem("impuestos") != null){ impuestos = JSON.parse(localStorage.getItem("impuestos")); }else{ flagToLoad = true; }
      retenciones        = []; if(localStorage.getItem("retenciones") != null){ retenciones = JSON.parse(localStorage.getItem("retenciones")); }else{ flagToLoad = true; }
      inventario         = []; if(localStorage.getItem("inventario") != null){ inventario = JSON.parse(localStorage.getItem("inventario")); }else{ flagToLoad = true; }
      _ID_BODEGA_USUARIO = 0;  if(localStorage.getItem("IDBODEGAUSUARIO") != null){ _ID_BODEGA_USUARIO = parseInt(localStorage.getItem("IDBODEGAUSUARIO")); }else{ flagToLoad = true; }
      cantidades_bodega  = []; if(localStorage.getItem("cantidadesbodega") != null){ cantidades_bodega = JSON.parse(localStorage.getItem("cantidadesbodega")); }else{ flagToLoad = true; }
      resoluciones       = []; if(localStorage.getItem("resoluciones") != null){ resoluciones = JSON.parse(localStorage.getItem("resoluciones")); }else{ flagToLoad = true; }
     
      //Preparar datos
      PrepareFacturas();
      PrepareClientes();
      PrepareBancos();
      PrepareCategoriasIngreso();
      PrepareCategoriasEgreso();
      PrepareImpuestos();
      PrepareRetenciones();
      PrepareInventario();
      buildSelectItems();
      BuildSelectCartera();

      setTimeout(()=>{ 
        if(flagToLoad){ 
          start_load(); 
        }else{
          $("#LoadingModal").modal("hide"); 
        }
      }, 500);
      
    }
    async function start_load(){
      $("#LoadingModal").modal("show");
      LoadFacturas();  
    }

    //Preparar datos
    async function PrepareFacturas(){
      //Agregar las facturas almacenadas
      for (var i = SYNC_ITEMS.length - 1; i >= 0; i--) {
        if(SYNC_ITEMS[i]["FACTURA"]["FACTURA"]){
          facturas_venta.push(SYNC_ITEMS[i]["FACTURA"]["FACTURA"]);
        }
      }
    }
    async function PrepareClientes(){
      $('#fac_cli_lis').selectpicker('destroy', true);
      //Select lista de clientes
      $('#fac_cli_lis option').each(function() { $(this).remove(); });
      $("#fac_cli_lis").append($('<option>', { value: 0, text : "Selecciona un cliente" }));
      for (var i=0; i<clientes.length; i++) {
        $("#fac_cli_lis").append($('<option>', { value: clientes[i]["ID"], text : clientes[i]["NOMBRE"] }));
      }
      $('#fac_cli_lis').selectpicker({ liveSearch:true });
    }
    async function PrepareBancos(){
      $('#fac_ven_cue option').each(function() { $(this).remove(); });
      $('#fac_pag_cue option').each(function() { $(this).remove(); });
      $("#fac_pag_cue").append($('<option>', { value: 0, text : "Selecciona una cuenta" }));
      for (var j = bancos_usuario.length - 1; j >= 0; j--) {
        for (var i = bancos.length - 1; i >= 0; i--) {
          if (bancos[i]["ID"]==bancos_usuario[j]["_ID_BANCO"]) {
            $("#fac_ven_cue").append($('<option>', { value: bancos[i]["ID"], text : bancos[i]["NOMBRE"] }));
            $("#fac_pag_cue").append($('<option>', { value: bancos[i]["ID"], text : bancos[i]["NOMBRE"] }));
          }
        }
      }
      $('#fac_pag_cue').val("0");
    }
    async function PrepareCategoriasIngreso(){
      $('#fac_ven_cat option').each(function() { $(this).remove(); });
      $('#add_pago_cat option').each(function() { $(this).remove(); });
      for (var i=0; i<categorias.length; i++) {
        $("#fac_ven_cat").append($('<option>', { value: categorias[i]["ID"], text : categorias[i]["NOMBRE"] }));
        $("#add_pago_cat").append($('<option>', { value: categorias[i]["ID"], text : categorias[i]["NOMBRE"] }));
      }
    }
    async function PrepareCategoriasEgreso(){
      $('#add_gasto_cat option').each(function() { $(this).remove(); });
      for (var i=0; i<categoriasE.length; i++) {
        $("#add_gasto_cat").append($('<option>', { value: categoriasE[i]["ID"], text : categoriasE[i]["NOMBRE"] }));
      }
    }
    async function PrepareImpuestos(){
      $('#fac_ven_imp option').each(function() { $(this).remove(); });
      $("#fac_ven_imp").append($('<option>', { value: 0, text : "Selecciona un impuesto" }));
      for (var i=0; i<impuestos.length; i++) { 
        $("#fac_ven_imp").append($('<option>', { value: impuestos[i]["PORCENTAJE"], text : impuestos[i]["NOMBRE"] }));
      }
      $('#fac_ven_imp').val("0");
    }
    async function PrepareRetenciones(){
      $('#fac_ven_lre option').each(function() { $(this).remove(); });
      $("#fac_ven_lre").append($('<option>', { value: 0, text : "Selecciona una retención" }));
      for (var i=0; i<retenciones.length; i++) { 
        $("#fac_ven_lre").append($('<option>', { value:retenciones[i]["ID"], text:retenciones[i]["NOMBRE"]+" "+retenciones[i]["PORCENTAJE"]+"%" }));
      }
      $('#fac_ven_lre').val("0");
    }
    async function PrepareInventario(){
      inventario = inventario.sort((a, b) => a["NOMBRE"].localeCompare(b["nombre"]));
      $("#fac_ven_obs").change(function() { get_price(); });
    }

    async function send_(destino_, data_){
      //Función promesa para procesar todas las peticiones Ajax
      return new Promise(function(resolve, reject) {
        $.ajax({
          async      : true,
          type       : "POST",
          timeout    : 10000,
          dataType   : "html",
          contentType: "application/x-www-form-urlencoded",
          url        : URL_SERVER + destino_,
          data       : data_,
          beforeSend : function(){},
          success    : function (datos){ return resolve( JSON.parse(datos) ); },
          error      : function (error){ return reject(error); }
        });
      });
    }
    async function message_(icon_, title_, message_, type_){ 
      //Función para mostrar mensajes
      switch (type_) {
        case 'info'   : toastr.info(message_, title_); break;
        case 'warning': toastr.warning(message_, title_); break;
        case 'success': toastr.success(message_, title_); break;
        case 'error'  : toastr.error(message_, title_); break;
        default: toastr.info(message_, title_); break;
      }

    }
    function zfill(number, width) { 
      //Ceros a la izquierda
      var numberOutput = Math.abs(number); /* Valor absoluto del número */
      var length = number.toString().length; /* Largo del número */
      var zero = "0"; /* String de cero */

      if (width <= length) {
        if (number < 0) {
          return ("-" + numberOutput.toString());
        } else {
          return numberOutput.toString();
        }
      } else {
        if (number < 0) {
          return ("-" + (zero.repeat(width - length)) + numberOutput.toString());
        } else {
          return ((zero.repeat(width - length)) + numberOutput.toString());
        }
      }
    }
    var fNumber = { 
      //Función para formatear Números
      sepMil: ".", // separador para los miles
      sepDec: ',', // separador para los decimales
      formatear:function async (num){
        num +='';
        var splitStr = num.split('.');
        var splitLeft = splitStr[0];
        var splitRight = splitStr.length > 1 ? this.sepDec + splitStr[1] : '';
        var regx = /(\d+)(\d{3})/;
        while (regx.test(splitLeft)) {
        splitLeft = splitLeft.replace(regx, '$1' + this.sepMil + '$2');
      }
        return this.simbol + splitLeft + splitRight;
      },go:function async(num, simbol){
        this.simbol = simbol ||'';
        return this.formatear(num);
      }
    }
    var MD5 = function(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase()};function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}

  });
})(jQuery);
