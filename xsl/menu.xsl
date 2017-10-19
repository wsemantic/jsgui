<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:template match="/">
  <div id="accordian">
  <ul>
    <xsl:for-each select="*/*[@rdn]">    	
		<li>
			<h3><span class="icon-dashboard"></span><xsl:value-of select="attribute::rdn" /></h3>
			<ul>
				<xsl:for-each select="./*[@rdn]"> 
					<li>
						<a href="#">						
							<xsl:attribute name="id"><xsl:value-of select="attribute::id" /></xsl:attribute>
							<xsl:attribute name="clsname"><xsl:value-of select="name()" /></xsl:attribute>
							<xsl:value-of select="attribute::rdn" />							
						</a>
					</li>
				</xsl:for-each>
			</ul>	
		</li>
    </xsl:for-each>
  </ul>
  </div>
</xsl:template>

</xsl:stylesheet>