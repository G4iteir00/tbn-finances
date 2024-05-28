import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import { TransactionScreen } from '../screens/TransactionScreen/TransactionScreen';
import { LogoutScreen } from '../screens/LogoutScreen/LogoutScreen'; // Nova tela para deslogar
import { UserSettingsScreen } from '../screens/UserSettingsScreen/UserSettingsScreen'; // Nova tela para as configurações do usuário
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let routeColor;
          if (route.name === 'Balanço') {
            iconName = 'ios-wallet';
            routeColor = '#F44336'; // Vermelho
          } else if (route.name === 'Sair') {
            iconName = 'ios-log-out-outline';
            routeColor = '#FFC107'; // Amarelo
          } else if (route.name === 'Configurações') {
            iconName = 'ios-settings-outline';
            routeColor = '#2196F3'; // Azul
          }

          return <Ionicons name={iconName} size={size} color={routeColor} />;
        },
        tabBarLabel: ({ focused, color }) => {
          let label;
          let labelColor = focused ? color : 'gray'; // Altera a cor do texto baseada no foco

          if (route.name === 'Balanço') {
            label = 'Balanço';
          } else if (route.name === 'Sair') {
            label = 'Sair';
          } else if (route.name === 'Configurações') {
            label = 'Configurações';
          }

          // Retorna um componente personalizado para tabBarLabel, se necessário
          return <Text style={{ color: labelColor, fontSize: 12 }}>{label}</Text>;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Balanço" component={TransactionScreen} />
      <Tab.Screen name="Configurações" component={UserSettingsScreen} />
      <Tab.Screen name="Sair" component={LogoutScreen} />
    </Tab.Navigator>
  );
}
