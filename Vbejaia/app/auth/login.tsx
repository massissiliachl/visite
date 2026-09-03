import React, { useState, useRef, useEffect } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
  Image
} from "react-native";


import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import axios from "axios";

import { StatusBar } from "expo-status-bar";

import { API_ROOT_URL } from "../../config/api";



const {width,height}=Dimensions.get("window");



export default function Login(){


const router=useRouter();



const [email,setEmail]=useState("");
const [password,setPassword]=useState("");
const [showPassword,setShowPassword]=useState(false);
const [loading,setLoading]=useState(false);



const fadeAnim=useRef(new Animated.Value(0)).current;
const slideAnim=useRef(new Animated.Value(30)).current;



useEffect(()=>{


Animated.parallel([


Animated.timing(
fadeAnim,
{
toValue:1,
duration:800,
useNativeDriver:true
}
),


Animated.timing(
slideAnim,
{
toValue:0,
duration:600,
useNativeDriver:true
}
)


]).start();



},[]);





const API_URL=`${API_ROOT_URL}/api`;





const handleLogin=async()=>{


if(!email || !password){

Alert.alert(
"Champs manquants",
"Remplissez tous les champs"
);

return;

}



setLoading(true);



try{


const res=await axios.post(

`${API_URL}/auth/login`,

{
email,
password
},

{
timeout:10000
}

);



await AsyncStorage.setItem(
"token",
res.data.token
);


await AsyncStorage.setItem(
"user",
JSON.stringify(res.data.user)
);



setLoading(false);



if(res.data.user.role==="admin"){

router.replace("/(tabs)/admin");

}else{

router.replace("/(tabs)/home");

}



}catch(error){


setLoading(false);


Alert.alert(
"Erreur",
"Email ou mot de passe incorrect"
);


}



};







return (



<KeyboardAvoidingView

style={styles.container}

behavior={
Platform.OS==="ios"
?"padding"
:"height"
}

>


<StatusBar style="light"/>


<TouchableWithoutFeedback
onPress={Keyboard.dismiss}
>



<ScrollView
contentContainerStyle={styles.scroll}
showsVerticalScrollIndicator={false}
>


<ImageBackground

source={{
uri:
"https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
}}

style={styles.bg}

>



<LinearGradient


colors={[
"rgba(0,59,115,.75)",
"rgba(20,184,166,.65)"
]}


style={styles.overlay}


>




<Animated.View

style={[

styles.content,

{
opacity:fadeAnim,
transform:[
{
translateY:slideAnim
}
]
}

]

}

>





<View style={styles.logoBox}>


<Image
  source={require("../../assets/images/logo.png")}
  style={styles.logo}
/>


</View>





<Text style={styles.title}>

Visit Béjaïa

</Text>



<Text style={styles.subtitle}>

Explorez la perle de la Kabylie

</Text>



<View style={styles.location}>


<Ionicons

name="location"

size={15}

color="#fff"

/>


<Text style={styles.locationText}>

Algérie - Béjaïa

</Text>


</View>







<View style={styles.card}>


<Text style={styles.welcome}>

Bon retour parmi nous

</Text>



<Text style={styles.small}>

Connectez-vous pour réserver vos activités

</Text>





<View style={styles.inputBox}>


<Ionicons

name="mail-outline"

size={22}

color="#14B8A6"

/>



<TextInput

placeholder="Adresse email"

placeholderTextColor="#94A3B8"

style={styles.input}

value={email}

onChangeText={setEmail}

keyboardType="email-address"

autoCapitalize="none"

/>



</View>






<View style={styles.inputBox}>


<Ionicons

name="lock-closed-outline"

size={22}

color="#14B8A6"

/>



<TextInput

placeholder="Mot de passe"

placeholderTextColor="#94A3B8"

style={styles.input}

secureTextEntry={!showPassword}

value={password}

onChangeText={setPassword}

/>



<TouchableOpacity

onPress={()=>setShowPassword(!showPassword)}

>


<Ionicons

name={
showPassword
?"eye-off-outline"
:"eye-outline"
}

size={22}

color="#FF5A5F"

/>


</TouchableOpacity>


</View>






<TouchableOpacity

style={styles.forgot}

>

<Text style={styles.forgotText}>

Mot de passe oublié ?

</Text>

</TouchableOpacity>








<TouchableOpacity

disabled={loading}

onPress={handleLogin}

>


<LinearGradient


colors={[
"#14B8A6",
"#0EA5E9",
"#FF5A5F"
]}


style={styles.button}


>



{
loading

?

<ActivityIndicator color="#fff"/>

:

<>

<Text style={styles.btnText}>

Explorer Béjaïa

</Text>


<Ionicons

name="arrow-forward"

size={22}

color="#fff"

/>


</>

}



</LinearGradient>


</TouchableOpacity>








<View style={styles.features}>


<Feature icon="boat" text="Excursions"/>

<Feature icon="restaurant" text="Gastronomie"/>

<Feature icon="bed" text="Hébergement"/>

<Feature icon="camera" text="Visites"/>


</View>





</View>






</Animated.View>



</LinearGradient>


</ImageBackground>



</ScrollView>



</TouchableWithoutFeedback>


</KeyboardAvoidingView>


);



}







function Feature({icon,text}){


return (

<View style={styles.feature}>


<Ionicons

name={icon}

size={24}

color="#FF5A5F"

/>


<Text style={styles.featureText}>

{text}

</Text>


</View>

);


}







const styles=StyleSheet.create({



container:{
flex:1,
backgroundColor:"#003B73"
},



scroll:{
flexGrow:1
},


bg:{
width,
height
},


overlay:{
flex:1,
justifyContent:"center",
padding:20
},



content:{
alignItems:"center"
},




logoBox:{


width:120,
height:120,

borderRadius:60,

backgroundColor:"#fff",

justifyContent:"center",

alignItems:"center",

borderWidth:4,

borderColor:"#FF5A5F",

elevation:15


},



logo:{
  width:95,
  height:95,

  borderRadius:70, 

  overflow:"hidden"
},




title:{

fontSize:32,

fontWeight:"900",

color:"#fff",

marginTop:15

},



subtitle:{

color:"#DFFBFF",

fontSize:15

},



location:{

flexDirection:"row",

backgroundColor:"rgba(255,255,255,.25)",

padding:8,

paddingHorizontal:15,

borderRadius:30,

marginTop:12

},



locationText:{

color:"#fff",

marginLeft:5

},




card:{


backgroundColor:"#fff",

width:"100%",

borderRadius:35,

padding:25,

marginTop:25

},




welcome:{

fontSize:24,

fontWeight:"900",

textAlign:"center",

color:"#003B73"

},



small:{

textAlign:"center",

color:"#64748B",

marginVertical:20

},





inputBox:{


height:58,

backgroundColor:"#F1F8FA",

borderRadius:18,

flexDirection:"row",

alignItems:"center",

paddingHorizontal:15,

marginBottom:15

},



input:{

flex:1,

paddingHorizontal:12,

color:"#003B73"

},




forgot:{

alignSelf:"flex-end",

marginBottom:20

},



forgotText:{

color:"#FF5A5F",

fontWeight:"700"

},





button:{


height:58,

borderRadius:20,

alignItems:"center",

justifyContent:"center",

flexDirection:"row"

},



btnText:{

color:"#fff",

fontWeight:"900",

fontSize:18,

marginRight:10

},



features:{


flexDirection:"row",

justifyContent:"space-between",

marginTop:25

},




feature:{

alignItems:"center"

},


featureText:{

fontSize:11,

color:"#64748B",

marginTop:5

}



});