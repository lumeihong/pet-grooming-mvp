import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens();

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';

import { colors } from './src/theme';
import { SessionProvider, useSession } from './src/lib/SessionContext';

import AuthScreen from './src/screens/AuthScreen';
import ClientHome from './src/screens/client/ClientHome';
import PostRequest from './src/screens/client/PostRequest';
import MatchResult from './src/screens/client/MatchResult';
import PayDeposit from './src/screens/client/PayDeposit';
import OrderDetail from './src/screens/client/OrderDetail';
import ChatScreen from './src/screens/ChatScreen';
import ReviewScreen from './src/screens/client/ReviewScreen';
import MyProfile from './src/screens/client/MyProfile';
import GroomerHome from './src/screens/groomer/GroomerHome';
import OrderTake from './src/screens/groomer/OrderTake';
import ActiveOrders from './src/screens/groomer/ActiveOrders';
import GroomerProfile from './src/screens/groomer/GroomerProfile';
import GroomerIncome from './src/screens/groomer/GroomerIncome';
import AdminScreen from './src/screens/admin/AdminScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { session } = useSession();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        ) : session.role === 'client' ? (
          <>
            <Stack.Screen name="ClientHome" component={ClientHome} options={{ title: 'PawGo' }} />
            <Stack.Screen name="PostRequest" component={PostRequest} options={{ title: '发布需求' }} />
            <Stack.Screen name="MatchResult" component={MatchResult} options={{ title: '为你推荐' }} />
            <Stack.Screen name="PayDeposit" component={PayDeposit} options={{ title: '支付定金' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetail} options={{ title: '订单详情' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '临时聊天' }} />
            <Stack.Screen name="Review" component={ReviewScreen} options={{ title: '评价' }} />
            <Stack.Screen name="MyProfile" component={MyProfile} options={{ title: '我的' }} />
          </>
        ) : session.role === 'groomer' ? (
          <>
            <Stack.Screen name="GroomerHome" component={GroomerHome} options={{ title: '派单' }} />
            <Stack.Screen name="OrderTake" component={OrderTake} options={{ title: '订单详情' }} />
            <Stack.Screen name="ActiveOrders" component={ActiveOrders} options={{ title: '进行中' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '临时聊天' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetail} options={{ title: '订单详情' }} />
            <Stack.Screen name="GroomerProfile" component={GroomerProfile} options={{ title: '我的资料' }} />
            <Stack.Screen name="GroomerIncome" component={GroomerIncome} options={{ title: '收入与历史' }} />
            <Stack.Screen name="MyProfile" component={MyProfile} options={{ title: '我的' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: '后台管理' }} />
            <Stack.Screen name="MyProfile" component={MyProfile} options={{ title: '我的' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <SessionProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </SessionProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
