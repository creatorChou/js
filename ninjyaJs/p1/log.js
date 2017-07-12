function log() {
	try
	{
		console.log.apply( console, arguments );
	}
	catch ( e )
	{
		try
		{
			opera.postError.apply( postError, arguments );
		}
		catch ( e )
		{
			alert( Array.prototype.join.apply( arguments, ' ' ) );
		}
	}
}