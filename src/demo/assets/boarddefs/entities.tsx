<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.12.2" name="entities" tilewidth="8" tileheight="13" tilecount="2" columns="0" objectalignment="topleft">
 <grid orientation="orthogonal" width="1" height="1"/>
 <tile id="0" type="Superball">
  <properties>
   <property name="Cel" type="int" propertytype="Cel" value="0"/>
   <property name="Tag" value="SuperballDefault"/>
   <property name="Layer" type="int" propertytype="Layer" value="2"/>
   <property name="Pal" type="int" propertytype="Pal" value="0"/>
   <property name="Stretch" type="bool" value="true"/>
   <property name="Z" type="int" propertytype="Z" value="0"/>
   <property name="ZTop" type="bool" value="false"/>
  </properties>
  <image source="../atlas/superball.aseprite" width="8" height="8"/>
 </tile>
 <tile id="1" type="P1">
  <image source="../atlas/backpacker.aseprite" width="8" height="13"/>
  <properties>
   <property name="Cel" type="int" propertytype="Cel" value="0"/>
   <property name="Tag" value="BackpackerWalkRight"/>
   <property name="Layer" type="int" propertytype="Layer" value="1"/>
   <property name="Pal" type="int" propertytype="Pal" value="0"/>
   <property name="Stretch" type="bool" value="true"/>
   <property name="Z" type="int" propertytype="Z" value="0"/>
   <property name="ZTop" type="bool" value="false"/>
   <property name="Clockwise" type="bool" value="true"/>
  </properties>
 </tile>
</tileset>
