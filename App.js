import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
enableScreens(); // React Navigation 7 需显式启用 react-native-screens
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';

import { colors } from './src/theme';
import { api } from './src/lib/api';

// 登录/角色选择
import AuthScreen from './src/screens/AuthScreen';
// 客户端
import ClientHome from './src/screens/client/ClientHome';
import PostRequest from './src/screens/client/PostRequest';
import MatchResult from './src/screens/client/MatchResult';
import PayDeposit from './src/screens/client/PayDeposit';
import OrderDetail from './src/screens/client/OrderDetail';
import ChatScreen from './src/screens/ChatScreen';
import ReviewScreen from './src/screens/client/ReviewScreen';
import MyProfile from './src/screens/client/MyProfile';
// 美容师端
import GroomerHome from './src/screens/groomer/GroomerHome';
import OrderTake from './src/screens/groomer/OrderTake';
import ActiveOrders from './src/screens/groomer/ActiveOrders';
import GroomerProfile from './src/screens/groomer/GroomerProfile';
import GroomerIncome from './src/screens/groomer/GroomerIncome';
// 后台
import AdminScreen from './src/screens/admin/AdminScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null); // {id, phone, role}
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    // 演示模式：预置一个客户会话，跳过登录即可体验闭环
    if (api.API_MODE === 'demo') {
      setSession({ id: 'u_client_demo', phone: '+6599999999', role: 'client' });
    }
    setBooted(true);
  }, []);

  if (!booted) return null;

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text }}
          >
            {!session ? (
              <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
            ) : session.role === 'client' ? (
              <>
                <Stack.Screen name="ClientHome" options={{ title: 'PawGo' }}>
                  {(p) => <ClientHome {...p} session={session} />}
                </Stack.Screen>
                <Stack.Screen name="PostRequest" component={PostRequest} options={{ title: '发布需求' }} />
                <Stack.Screen name="MatchResult" component={MatchResult} options={{ title: '为你推荐' }} />
                <Stack.Screen name="PayDeposit" component={PayDeposit} options={{ title: '支付定金' }} />
                <Stack.Screen name="OrderDetail" options={{ title: '订单详情' }}>
                  {(p) => <OrderDetail {...p} session={session} />}
                </Stack.Screen>
                <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '临时聊天' }} />
                <Stack.Screen name="Review" component={ReviewScreen} options={{ title: '评价' }} />
                <Stack.Screen name="MyProfile" component={MyProfile} options={{ title: '我的' }} />
              </>
            ) : session.role === 'groomer' ? (
              <>
                <Stack.Screen name="GroomerHome" options={{ title: '接单大厅' }}>
                  {(p) => <GroomerHome {...p} session={session} />}
                </Stack.Screen>
                <Stack.Screen name="OrderTake" component={OrderTake} options={{ title: '订单详情' }} />
                <Stack.Screen name="ActiveOrders" component={ActiveOrders} options={{ title: '进行中' }} />
                <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '临时聊天' }} />
                <Stack.Screen name="GroomerProfile" component={GroomerProfile} options={{ title: '我的资料' }} />
                <Stack.Screen name="GroomerIncome" component={GroomerIncome} options={{ title: '收入与历史' }} />
              </>
            ) : (
              <Stack.Screen name="Admin" component={AdminScreen} options={{ title: '后台管理' }} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
