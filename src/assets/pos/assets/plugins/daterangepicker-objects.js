/*
 |--------------------------------------------------------------------------
 | Declaraciones de objetos DatePickerRange
 |--------------------------------------------------------------------------
 */

'use strict';

(function ($) {
  $(document).ready(function () {

    //Objeto Dashboard principal
    $('#rango_fechas-1').daterangepicker({ "locale": {
            "format": "YYYY-MM-DD",
            "separator": "__",
            "applyLabel": "Guardar",
            "cancelLabel": "Cancelar",
            "fromLabel": "Desde",
            "toLabel": "Hasta",
            "customRangeLabel": "Personalizar",
            "daysOfWeek": ["Do","Lu","Ma","Mi","Ju","Vi","Sa"],
            "monthNames": ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Setiembre","Octubre","Noviembre","Diciembre"],
            "firstDay": 1
        },
        "startDate": getFirstDayMonth(),
        "endDate": getLastDayMonth()
    });
    
 
    //Primer dia del mes
    function getFirstDayMonth(){     
      return moment().format("YYYY-MM-DD");
    }

    //Ultimo dia del mes
    function getLastDayMonth(){
      return moment().format("YYYY-MM-DD");
    }

 
    
  });
})(jQuery);
