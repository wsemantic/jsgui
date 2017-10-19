<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">
  <h2>Propiedades</h2>
  <table border="1">
    <tr bgcolor="#9acd32">
      <th style="text-align:left">NAME</th>
      <th style="text-align:left">TYPE</th>
    </tr>
    <xsl:for-each select="child::*/child::DATAPROP">
    <tr>
      <td><xsl:value-of select="attribute::name" /></td>
      <td><xsl:value-of select="attribute::type" /></td>
    </tr>
    </xsl:for-each>
  </table>
</xsl:template>

</xsl:stylesheet>