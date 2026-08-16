import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/auth.store';
import { 
  getODMLRequestsForFaculty, 
  updateODMLRequestStatus, 
  loadFacultySubjects,
  getCorrectionRequestsForFaculty,
  approveCorrectionRequest,
  rejectCorrectionRequest,
  applyApprovedODML,
} from '../../src/services/firestore.service';
import { ODMLRequest, AttendanceCorrectionRequest } from '../../src/types/session.types';
import { Check, X, FileText, RotateCcw } from 'lucide-react-native';

export default function InboxScreen() {
  const { user } = useAuthStore();
  const uid = user?.uid;
  const displayName = user?.displayName || 'Faculty';

  const [activeTab, setActiveTab] = useState<'ODML' | 'CORRECTIONS'>('ODML');
  const [requests, setRequests] = useState<ODMLRequest[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllRequests = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const subjects = await loadFacultySubjects(uid);
      const [odmlData, corrData] = await Promise.all([
        getODMLRequestsForFaculty(subjects),
        getCorrectionRequestsForFaculty(subjects)
      ]);
      setRequests(odmlData.sort((a, b) => b.createdAt - a.createdAt));
      setCorrections(corrData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllRequests();
  }, [uid]);

  // --- OD/ML Handlers ---
  const handleApproveODML = async (request: ODMLRequest) => {
    await applyApprovedODML(request);
    await updateODMLRequestStatus(request.requestId, 'APPROVED');
    loadAllRequests();
  };

  const handleRejectODML = async (requestId: string) => {
    await updateODMLRequestStatus(requestId, 'REJECTED');
    loadAllRequests();
  };

  // --- Correction Handlers ---
  const handleApproveCorrection = async (item: AttendanceCorrectionRequest) => {
    if (!uid) return;
    await approveCorrectionRequest(item, uid, displayName);
    loadAllRequests();
  };

  const handleRejectCorrection = async (requestId: string) => {
    if (!uid) return;
    await rejectCorrectionRequest(requestId, uid);
    loadAllRequests();
  };

  // --- Renderers ---
  const renderODMLItem = ({ item }: { item: ODMLRequest }) => (
    <View className="bg-white p-4 rounded-2xl mb-4 border border-cardBorder shadow-sm">
      <View className="flex-row justify-between mb-2">
        <View className="bg-amber-100 px-2 py-1 rounded">
          <Text className="text-xs font-bold text-amber-800 font-sans">{item.type}</Text>
        </View>
        <Text className="text-xs text-gray-500 font-sans">
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text className="font-bold text-lg text-gray-900 font-sans">{item.studentName}</Text>
      <Text className="text-sm text-gray-600 font-sans mb-3">{item.subjectCode} • {item.dates.length} days requested</Text>
      
      <View className="bg-gray-50 p-3 rounded-lg mb-4">
        <Text className="text-xs font-bold text-gray-500 uppercase font-sans mb-1">Reason</Text>
        <Text className="text-sm text-gray-800 font-sans italic">"{item.reason}"</Text>
      </View>

      <View className="flex-row justify-end space-x-2">
        <TouchableOpacity 
          className="px-4 py-2 bg-red-50 rounded-lg flex-row items-center border border-red-200 mr-2"
          onPress={() => handleRejectODML(item.requestId)}
        >
          <X color="#b91c1c" size={16} className="mr-1" />
          <Text className="text-red-700 font-bold font-sans text-sm">Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="px-4 py-2 bg-green-50 rounded-lg flex-row items-center border border-green-200"
          onPress={() => handleApproveODML(item)}
        >
          <Check color="#15803d" size={16} style={{ marginRight: 4 }}  />
          <Text className="text-green-700 font-bold font-sans text-sm">Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCorrectionItem = ({ item }: { item: AttendanceCorrectionRequest }) => (
    <View className="bg-white p-4 rounded-2xl mb-4 border border-cardBorder shadow-sm">
      <View className="flex-row justify-between mb-2">
        <View className="bg-orange-100 px-2 py-1 rounded flex-row items-center">
          <RotateCcw color="#4338ca" size={12} className="mr-1" />
          <Text className="text-xs font-bold text-orange-800 font-sans">CORRECTION</Text>
        </View>
        <Text className="text-xs text-gray-500 font-sans">
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text className="font-bold text-lg text-gray-900 font-sans">{item.studentName}</Text>
      <Text className="text-sm text-gray-600 font-sans mb-1">
        {item.subjectCode} • Request to remove <Text className="font-bold">{item.currentType}</Text>
      </Text>
      <Text className="text-sm text-gray-600 font-sans mb-3">
        Date: {item.date}
      </Text>
      
      <View className="bg-gray-50 p-3 rounded-lg mb-4 border-l-4 border-orange-400">
        <Text className="text-xs font-bold text-gray-500 uppercase font-sans mb-1">Student's Reason</Text>
        <Text className="text-sm text-gray-800 font-sans italic">"{item.reason}"</Text>
      </View>

      <View className="flex-row justify-end space-x-2">
        <TouchableOpacity 
          className="px-4 py-2 bg-red-50 rounded-lg flex-row items-center border border-red-200 mr-2"
          onPress={() => handleRejectCorrection(item.requestId)}
        >
          <X color="#b91c1c" size={16} className="mr-1" />
          <Text className="text-red-700 font-bold font-sans text-sm">Keep {item.currentType}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="px-4 py-2 bg-green-50 rounded-lg flex-row items-center border border-green-200"
          onPress={() => handleApproveCorrection(item)}
        >
          <Check color="#15803d" size={16} style={{ marginRight: 4 }}  />
          <Text className="text-green-700 font-bold font-sans text-sm">Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-offWhite">
              <View className="flex-1 px-4 pt-2">
          <Text className="text-3xl font-bold font-sans text-gray-900 mb-4">Inbox</Text>
          
          <View className="flex-row bg-gray-100 p-1 rounded-xl mb-4">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'ODML' ? 'bg-white' : ''}`}
              onPress={() => setActiveTab('ODML')}
            >
              <Text className={`font-bold font-sans ${activeTab === 'ODML' ? 'text-primaryOrange' : 'text-gray-500'}`}>
                OD / ML {requests.length > 0 ? `(${requests.length})` : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'CORRECTIONS' ? 'bg-white' : ''}`}
              onPress={() => setActiveTab('CORRECTIONS')}
            >
              <Text className={`font-bold font-sans ${activeTab === 'CORRECTIONS' ? 'text-primaryOrange' : 'text-gray-500'}`}>
                Corrections {corrections.length > 0 ? `(${corrections.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        
        {loading ? (
          <ActivityIndicator color="#F97316" size="large" className="mt-10" />
        ) : (
          activeTab === 'ODML' && requests.length === 0 ? (
            <View className="flex-1 items-center justify-center pb-20">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <FileText color="#9CA3AF" size={32} />
              </View>
              <Text className="text-gray-500 font-sans">No pending OD or medical-leave requests.</Text>
            </View>
          ) : activeTab === 'CORRECTIONS' && corrections.length === 0 ? (
            <View className="flex-1 items-center justify-center pb-20">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <RotateCcw color="#9CA3AF" size={32} />
              </View>
              <Text className="text-gray-500 font-sans">No pending correction requests.</Text>
            </View>
          ) : activeTab === 'ODML' ? (
            <FlatList
              data={requests}
              keyExtractor={item => item.requestId}
              renderItem={renderODMLItem}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={corrections}
              keyExtractor={item => item.requestId}
              renderItem={renderCorrectionItem}
              showsVerticalScrollIndicator={false}
            />
          )
        )}
      </View>
          </SafeAreaView>
  );
}
