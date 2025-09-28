import { InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Modal, Table, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import type { Candidate } from '../../types/candidate';

export default function InterviewerDashboard() {
  const candidates = useAppSelector(s => s.candidates.list);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c =>
      (c.name ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
      (c.phone ?? '').toLowerCase().includes(searchText.toLowerCase())
    );
  }, [candidates, searchText]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Candidate, b: Candidate) => (a.name ?? '').localeCompare(b.name ?? ''),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a: Candidate, b: Candidate) => (a.email ?? '').localeCompare(b.email ?? ''),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      sorter: (a: Candidate, b: Candidate) => (a.phone ?? '').localeCompare(b.phone ?? ''),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a: Candidate, b: Candidate) => (a.score ?? 0) - (b.score ?? 0),
    },
    {
      title: 'Test Completed',
      dataIndex: 'testCompleted',
      key: 'testCompleted',
      render: (completed: boolean) => (completed ? 'Yes' : 'No'),
      sorter: (a: Candidate, b: Candidate) => Number(a.testCompleted) - Number(b.testCompleted),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Candidate) => (
        <Button
          type="text"
          icon={<InfoCircleOutlined />}
          onClick={() => {
            setSelectedCandidate(record);
            setModalVisible(true);
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card style={{ borderRadius: 8 }}>
        <Typography.Title level={4}>Candidates Dashboard</Typography.Title>

        <Input
          placeholder="Search by name, email, or phone"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 300, width: '100%' }}
        />

        <Table
            dataSource={filteredCandidates}
            columns={columns}
            rowKey="id"
            onRow={(record) => ({
                onClick: () => setSelectedCandidate(record),
            })}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 'max-content' }} 
        />

        {selectedCandidate && (
          <Modal
            title={`${selectedCandidate.name ?? 'Candidate'} Details`}
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
          >
            <p><strong>Summary:</strong> {selectedCandidate.summary ?? 'N/A'}</p>
            <div style={{ marginTop: 16 }}>
              <Typography.Title level={5}>Chat</Typography.Title>
              <div style={{ maxHeight: 300, overflowY: 'auto', padding: 8, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                {selectedCandidate.chat.length > 0 ? (
                  selectedCandidate.chat.map(msg => (
                    <div key={msg.id} style={{ marginBottom: 6, textAlign: msg.role === 'ai' ? 'left' : 'right' }}>
                      <strong>{msg.role === 'ai' ? 'Bot' : 'Candidate'}:</strong> {msg.text}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#999' }}>No chat messages</div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </Card>
    </div>
  );
}
