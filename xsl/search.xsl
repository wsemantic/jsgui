<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:template match="/">
  <div>
  
    <xsl:for-each select="*/DATAPROP">    	
			<P><xsl:value-of select="name(.)" /></P>
    </xsl:for-each>
  
  </div>
</xsl:template>

</xsl:stylesheet>