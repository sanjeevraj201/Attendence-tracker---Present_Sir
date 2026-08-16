import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Search, User, Book, Edit3, RefreshCw } from 'lucide-react-native';
import { AppUser } from '../../src/types/user.types';
import { Subject, AttendanceType } from '../../src/types/attendance.types';
import { loadSubjects, adminEditAttendance } from '../../src/services/firestore.service';
import { useAuthStore } from '../../src/stores/auth.store';
import { useAdminStore, SubjectGroup } from '../../src/stores/admin.store';

type EditorTab = 'STUDENTS' | 'SUBJECTS';

export default function AdminAttendanceEditorScreen() {
  const { user } = useAuthStore();
  const { students, subjectsMap, allStudentSubjects, isLoading, loadAllData, updateStudentSubjectLocally } = useAdminStore();
  const insets = useSafeAreaInsets();
  const editorId = user?.uid;
  const editorName = user?.displayName || 'Admin';

  const [activeTab, setActiveTab] = useState<EditorTab>('STUDENTS');

  // Student Tab State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Subject Tab State
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('');

  // Navigation State
  const [selectedStudent, setSelectedStudent] = useState<AppUser | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]); // Current selected student's subjects
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null); // The specific history view
  const [selectedGlobalSubject, setSelectedGlobalSubject] = useState<SubjectGroup | null>(null); // For Subject drill-down

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [newType, setNewType] = useState<AttendanceType>('PRESENT');
  const [editReason, setEditReason] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    loadAllData(); // Will use cache if already loaded
  }, []);

  // -- Computeds --
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery) return students;
    const lower = studentSearchQuery.toLowerCase();
    return students.filter(s => 
      (s.displayName || '').toLowerCase().includes(lower) || 
      (s.email || '').toLowerCase().includes(lower) ||
      (s.staffId || '').toLowerCase().includes(lower)
    );
  }, [students, studentSearchQuery]);

  const filteredGlobalSubjects = useMemo(() => {
    const list = Object.values(subjectsMap);
    if (!subjectSearchQuery) return list;
    const lower = subjectSearchQuery.toLowerCase();
    return list.filter(s => 
      s.code.toLowerCase().includes(lower) || 
      s.name.toLowerCase().includes(lower)
    );
  }, [subjectsMap, subjectSearchQuery]);

  const filteredEnrolledStudents = useMemo(() => {
    if (!selectedGlobalSubject) return [];
    if (!studentSearchQuery) return selectedGlobalSubject.students;
    const lower = studentSearchQuery.toLowerCase();
    return selectedGlobalSubject.students.filter(s => 
      (s.displayName || '').toLowerCase().includes(lower) || 
      (s.email || '').toLowerCase().includes(lower)
    );
  }, [selectedGlobalSubject, studentSearchQuery]);

  // -- Handlers --
  const handleSelectStudent = (student: AppUser) => {
    setSelectedStudent(student);
    setSubjects(allStudentSubjects[student.uid] || []);
  };

  const handleSelectGlobalSubject = (subjectGroup: SubjectGroup) => {
    setSelectedGlobalSubject(subjectGroup);
    setStudentSearchQuery('');
  };

  const handleSelectEnrolledStudent = (student: AppUser) => {
    if (!selectedGlobalSubject) return;
    setSelectedStudent(student);
    const subs = allStudentSubjects[student.uid] || [];
    setSubjects(subs);
    const specificSub = subs.find(s => s.code === selectedGlobalSubject.code);
    if (specificSub) {
      setSelectedSubject(specificSub);
    } else {
      Alert.alert('Error', 'Subject details not found for this student.');
      setSelectedStudent(null);
    }
  };

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setNewType(record.type as AttendanceType);
    setEditReason('');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent || !selectedSubject || !editingRecord || !editorId) return;
    
    setSubmittingEdit(true);
    try {
      await adminEditAttendance({
        editorId,
        editorName,
        studentId: selectedStudent.uid,
        studentName: selectedStudent.displayName || 'Unknown Student',
        subjectId: selectedSubject.id,
        subjectCode: selectedSubject.code,
        date: editingRecord.date,
        periodIndex: editingRecord.periodIndex,
        newType,
        reason: editReason || 'Admin manual override',
      });
      
      setEditModalVisible(false);
      
      // Refresh local cache for seamless UX
      const newSubs = await loadSubjects(selectedStudent.uid);
      updateStudentSubjectLocally(selectedStudent.uid, newSubs);
      setSubjects(newSubs);
      
      const updatedSub = newSubs.find(s => s.id === selectedSubject.id);
      if (updatedSub) {
        setSelectedSubject(updatedSub);
      }

    } catch (e) {
      Alert.alert('Error', 'Failed to update attendance.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Safe area padding generator
  const getContainerStyle = () => ({
    flex: 1,
    backgroundColor: '#F9FAFB', // offWhite
    paddingTop: insets.top,
    paddingBottom: 0 // Tabs handle bottom inset
  });

  // --- Renderers ---

  if (selectedSubject && selectedStudent) {
    // Level 3: Subject History View
    return (
      <View style={getContainerStyle()}>
        <View className="flex-1 px-4 pt-2">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => setSelectedSubject(null)} className="mr-3">
              <ArrowLeft color="#374151" size={24} />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold font-sans text-gray-900">{selectedSubject.code}</Text>
              <Text className="text-sm text-gray-500 font-sans">{selectedStudent.displayName}</Text>
            </View>
          </View>

          <FlatList
            data={[...selectedSubject.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            keyExtractor={item => `${item.date}_${item.periodIndex}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                className="bg-white p-4 rounded-xl mb-3 border border-gray-200 shadow-sm flex-row justify-between items-center"
                onPress={() => openEditModal(item)}
              >
                <View>
                  <Text className="font-bold text-gray-900">{item.date}</Text>
                  <Text className="text-xs text-gray-500">{item.dayOfWeek} • Period {item.periodIndex + 1}</Text>
                </View>
                <View className="flex-row items-center">
                  <View className={`px-3 py-1 rounded-full ${
                    item.type === 'PRESENT' ? 'bg-green-100' :
                    item.type === 'ABSENT' ? 'bg-red-100' :
                    item.type === 'OD' ? 'bg-blue-100' : 'bg-purple-100'
                  }`}>
                    <Text className={`text-xs font-bold ${
                      item.type === 'PRESENT' ? 'text-green-800' :
                      item.type === 'ABSENT' ? 'text-red-800' :
                      item.type === 'OD' ? 'text-blue-800' : 'text-purple-800'
                    }`}>{item.type}</Text>
                  </View>
                  <Edit3 size={16} color="#9CA3AF" className="ml-3" />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No history for this subject.</Text>}
          />

          {/* Edit Modal */}
          <Modal visible={editModalVisible} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
              <View className="bg-white rounded-2xl p-6">
                <Text className="text-xl font-bold mb-2">Edit Attendance</Text>
                <Text className="text-gray-500 mb-6">{editingRecord?.date} • Period {editingRecord?.periodIndex + 1}</Text>

                <View className="flex-row flex-wrap gap-2 mb-6">
                  {(['PRESENT', 'ABSENT', 'OD', 'ML'] as AttendanceType[]).map(type => (
                    <TouchableOpacity
                      key={type}
                      className={`px-4 py-2 rounded-lg border ${newType === type ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
                      onPress={() => setNewType(type)}
                    >
                      <Text className={`font-bold ${newType === type ? 'text-orange-700' : 'text-gray-600'}`}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  placeholder="Reason for change (optional)"
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6 min-h-[80px]"
                  multiline
                  value={editReason}
                  onChangeText={setEditReason}
                />

                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text className="font-bold text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="flex-1 py-3 bg-orange-600 rounded-xl items-center"
                    onPress={handleSaveEdit}
                    disabled={submittingEdit}
                  >
                    {submittingEdit ? <ActivityIndicator color="white" /> : <Text className="font-bold text-white">Save Changes</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    );
  }

  if (selectedStudent && !selectedGlobalSubject) {
    // Level 2 (Student flow): Student Subjects View
    return (
      <View style={getContainerStyle()}>
        <View className="flex-1 px-4 pt-2">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => setSelectedStudent(null)} className="mr-3">
              <ArrowLeft color="#374151" size={24} />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold font-sans text-gray-900">{selectedStudent.displayName}</Text>
              <Text className="text-sm text-gray-500 font-sans">{selectedStudent.email}</Text>
            </View>
          </View>

          <FlatList
            data={subjects}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                className="bg-white p-4 rounded-xl mb-3 border border-gray-200 shadow-sm flex-row items-center justify-between"
                onPress={() => setSelectedSubject(item)}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
                    <Book color="#3b82f6" size={20} />
                  </View>
                  <View>
                    <Text className="font-bold text-gray-900">{item.code}</Text>
                    <Text className="text-xs text-gray-500">{item.name}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-gray-900">{item.total > 0 ? Math.round((item.attended / item.total) * 100) : 0}%</Text>
                  <Text className="text-xs text-gray-500">{item.attended}/{item.total}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No subjects found.</Text>}
          />
        </View>
      </View>
    );
  }

  if (selectedGlobalSubject) {
    // Level 2 (Subject flow): Enrolled Students View
    return (
      <View style={getContainerStyle()}>
        <View className="flex-1 px-4 pt-2">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => setSelectedGlobalSubject(null)} className="mr-3">
              <ArrowLeft color="#374151" size={24} />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold font-sans text-gray-900">{selectedGlobalSubject.code}</Text>
              <Text className="text-sm text-gray-500 font-sans">{selectedGlobalSubject.name}</Text>
            </View>
          </View>

          <View className="bg-white flex-row items-center px-4 py-3 rounded-xl border border-gray-200 mb-4">
            <Search color="#9CA3AF" size={20} className="mr-2" />
            <TextInput
              placeholder="Search enrolled students..."
              className="flex-1 text-base"
              value={studentSearchQuery}
              onChangeText={setStudentSearchQuery}
            />
          </View>

          <FlatList
            data={filteredEnrolledStudents}
            keyExtractor={item => item.uid}
            renderItem={({ item }) => (
              <TouchableOpacity 
                className="bg-white p-4 rounded-xl mb-3 border border-gray-200 shadow-sm flex-row items-center"
                onPress={() => handleSelectEnrolledStudent(item)}
              >
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
                  <User color="#6B7280" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-900 text-base">{item.displayName || 'Unknown'}</Text>
                  <Text className="text-sm text-gray-500">{item.email}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No students found.</Text>}
          />
        </View>
      </View>
    );
  }

  // Level 1: Root Tab View with Segmented Control
  return (
    <View style={getContainerStyle()}>
      <View className="flex-1 px-4 pt-2">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold font-sans text-gray-900">Attendance Editor</Text>
          <TouchableOpacity 
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-200"
            onPress={() => loadAllData(true)}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator size="small" color="#F97316" /> : <RefreshCw color="#374151" size={20} />}
          </TouchableOpacity>
        </View>

        {/* Segmented Control */}
        <View className="flex-row bg-gray-200 rounded-xl p-1 mb-6">
          <TouchableOpacity 
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'STUDENTS' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => { setActiveTab('STUDENTS'); setSubjectSearchQuery(''); }}
          >
            <Text className={`font-bold font-sans ${activeTab === 'STUDENTS' ? 'text-orange-600' : 'text-gray-500'}`}>Students</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'SUBJECTS' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => { setActiveTab('SUBJECTS'); setStudentSearchQuery(''); }}
          >
            <Text className={`font-bold font-sans ${activeTab === 'SUBJECTS' ? 'text-orange-600' : 'text-gray-500'}`}>Subjects</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#F97316" size="large" className="mt-10" />
        ) : activeTab === 'STUDENTS' ? (
          // Root Students View
          <>
            <View className="bg-white flex-row items-center px-4 py-3 rounded-xl border border-gray-200 mb-4">
              <Search color="#9CA3AF" size={20} className="mr-2" />
              <TextInput
                placeholder="Search all students..."
                className="flex-1 text-base"
                value={studentSearchQuery}
                onChangeText={setStudentSearchQuery}
              />
            </View>

            <FlatList
              data={filteredStudents}
              keyExtractor={item => item.uid}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="bg-white p-4 rounded-xl mb-3 border border-gray-200 shadow-sm flex-row items-center"
                  onPress={() => handleSelectStudent(item)}
                >
                  <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
                    <User color="#6B7280" size={24} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-base">{item.displayName || 'Unknown'}</Text>
                    <Text className="text-sm text-gray-500">{item.email}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No students found.</Text>}
            />
          </>
        ) : (
          // Root Subjects View
          <>
            <View className="bg-white flex-row items-center px-4 py-3 rounded-xl border border-gray-200 mb-4">
              <Search color="#9CA3AF" size={20} className="mr-2" />
              <TextInput
                placeholder="Search subject code or name..."
                className="flex-1 text-base"
                value={subjectSearchQuery}
                onChangeText={setSubjectSearchQuery}
              />
            </View>

            <FlatList
              data={filteredGlobalSubjects}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="bg-white p-4 rounded-xl mb-3 border border-gray-200 shadow-sm flex-row items-center justify-between"
                  onPress={() => handleSelectGlobalSubject(item)}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-3">
                      <Book color="#3b82f6" size={24} />
                    </View>
                    <View className="flex-1 pr-4">
                      <Text className="font-bold text-gray-900 text-base">{item.code}</Text>
                      <Text className="text-sm text-gray-500" numberOfLines={1}>{item.name}</Text>
                    </View>
                  </View>
                  <View className="items-end bg-gray-50 px-3 py-1 rounded-lg">
                    <Text className="font-bold text-gray-900">{item.students.length}</Text>
                    <Text className="text-xs text-gray-500">Students</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text className="text-center text-gray-500 mt-10">No subjects found.</Text>}
            />
          </>
        )}
      </View>
    </View>
  );
}
