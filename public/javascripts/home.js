$(function(){
	$("#register").on("click",function(){
		var $form = $("form");
		$form.attr("action","/register");
		$form.submit();
	});
	$("#editor").on("click",function(){
		var $form = $("form");
		$form.attr("action","/startEditor");
		$form.submit();
	});
});
