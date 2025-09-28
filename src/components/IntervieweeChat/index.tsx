import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Grid, Input, List, message, Modal, Popconfirm, Typography, Upload } from 'antd';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
    addChatMessage,
    createCandidate,
    deleteCandidate,
    updateCandidateProfile
} from '../../store/slices/candidatesSlice';
import { findEmail, findName, findPhone } from '../../utils/extractors';
import regex from '../../utils/helpers/regex';
import { extractTextFromDocx, extractTextFromPdf } from '../../utils/pdfHelpers';
import Loader from '../Loader';

interface Question {
  questionId: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  answer?: string;
}

export default function IntervieweeChat() {
  const dispatch = useAppDispatch();
  const candidates = useAppSelector(s => s.candidates.list);
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const candidate = currentId ? candidates.find(c => c.id === currentId) : null;

  const getNextMissingField = () => {
    if (!candidate) return null;
    if (!candidate.name) return 'name';
    if (!candidate.email) return 'email';
    if (!candidate.phone) return 'phone';
    return null;
  };
  const nextField = getNextMissingField();

  async function handleResume(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let text = '';
    if (ext === 'pdf') text = await extractTextFromPdf(file);
    else if (ext === 'docx') text = await extractTextFromDocx(file);
    else return;

    const name = findName(text) ?? undefined;
    const email = findEmail(text) ?? undefined;
    const phone = findPhone(text) ?? undefined;

    const id = uuidv4();
    dispatch(createCandidate({
      id,
      name,
      email,
      phone,
      chat: [],
      resumeFileName: file.name,
      score: 0,
      testCompleted: false,
      summary: ''
    }));
    setCurrentId(id);
    setTestStarted(false);
    setQuestionQueue([]);
    setCurrentQuestionIndex(0);
    setTimer(0);
    setScore(0);

    const firstMissing = !name ? 'name' : !email ? 'email' : !phone ? 'phone' : null;
    if (firstMissing) {
      dispatch(addChatMessage({
        id,
        msg: { id: uuidv4(), role: 'ai', text: `Bot: Please provide your ${firstMissing}.`, timestamp: new Date().toISOString() }
      }));
    }
  }

  const startTest = async () => {
    if (!currentId || nextField) return;

    try {
      setLoading(true);
      setTestStarted(true);
      setPaused(false);
      setShowResumeModal(false);

      const { data } = await axios.post('https://ai.lyfeboat.in/api/generate-test', {
        context: candidate?.name ?? ''
      });

      const questions: Question[] = data.questions.map((q: any) => ({
        questionId: q.questionId,
        question: q.question,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit
      }));

      setQuestionQueue(questions);
      setCurrentQuestionIndex(0);
      setTimer(questions[0].timeLimit);

      dispatch(addChatMessage({
        id: currentId,
        msg: { id: uuidv4(), role: 'ai', text: questions[0].question, timestamp: new Date().toISOString() }
      }));

    } catch (err) {
      message.error('Failed to fetch test questions. Try again.');
      console.error(err);
      setTestStarted(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentId) return;
    const saveState = {
      currentId,
      questionQueue,
      currentQuestionIndex,
      timer,
      testStarted,
      score,
      paused
    };
    localStorage.setItem('interviewState', JSON.stringify(saveState));
  }, [currentId, questionQueue, currentQuestionIndex, timer, testStarted, score, paused]);


  useEffect(() => {
    if (currentId) return;
    const saved = localStorage.getItem('interviewState');
    if (!saved) return;

    const parsed = JSON.parse(saved);
    const savedCandidate = candidates.find(c => c.id === parsed.currentId);
    if (savedCandidate && !savedCandidate.testCompleted) {
      setCurrentId(parsed.currentId);
      setQuestionQueue(parsed.questionQueue);
      setCurrentQuestionIndex(parsed.currentQuestionIndex);
      setTimer(parsed.timer);
      setTestStarted(parsed.testStarted);
      setScore(parsed.score);
      setPaused(true);
      setShowResumeModal(true);
    } else {
      localStorage.removeItem('interviewState');
    }
  }, [candidates, currentId]);


  useEffect(() => {
    if (!testStarted || paused || questionQueue.length === 0 || currentQuestionIndex >= questionQueue.length) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timer, currentQuestionIndex, testStarted, questionQueue, paused]);

  const pauseTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPaused(true);
  };

  const resumeTest = () => {
    setPaused(false);
    setShowResumeModal(false);


    if (questionQueue.length > 0 && currentQuestionIndex < questionQueue.length) {
      setTimer(questionQueue[currentQuestionIndex].timeLimit);
    }
  };

  const handleSendMessage = () => {
  if (!currentId || !chatInput.trim()) return;

  dispatch(addChatMessage({
    id: currentId,
    msg: { id: uuidv4(), role: 'candidate', text: chatInput.trim(), timestamp: new Date().toISOString() }
  }));

  if (nextField) {
    const value = chatInput.trim();


    if (nextField === 'email' && !regex.EMAIL.test(value)) {
      message.warning("Please enter a valid email address.");
      setChatInput('');
      return;
    }
    if (nextField === 'phone' && !regex.PHONE.test(value)) {
      message.warning("Please enter a valid phone number.");
      setChatInput('');
      return;
    }
    const newData: any = {};
    newData[nextField] = value;
    dispatch(updateCandidateProfile({ id: currentId, data: newData }));

    const updatedCandidate = { ...candidate, ...newData };
    const remainingField =
      !updatedCandidate.name ? 'name' :
      !updatedCandidate.email ? 'email' :
      !updatedCandidate.phone ? 'phone' : null;

    if (remainingField) {
      dispatch(addChatMessage({
        id: currentId,
        msg: { id: uuidv4(), role: 'ai', text: `Bot: Please provide your ${remainingField}.`, timestamp: new Date().toISOString() }
      }));
    }
  } else if (testStarted && questionQueue.length > 0) {
    const updatedQueue = [...questionQueue];
    updatedQueue[currentQuestionIndex].answer = chatInput.trim();
    setQuestionQueue(updatedQueue);
    handleNextQuestion();
  }

  setChatInput('');
};

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questionQueue.length) {
      setTimer(0);
      setTestStarted(false);
      evaluateTest();
      return;
    }

    setCurrentQuestionIndex(nextIndex);
    setTimer(questionQueue[nextIndex].timeLimit);

    dispatch(addChatMessage({
      id: currentId!,
      msg: { id: uuidv4(), role: 'ai', text: questionQueue[nextIndex].question, timestamp: new Date().toISOString() }
    }));
  };

  const evaluateTest = async () => {
    if (!currentId) return;

    try {
      setLoading(true);
      const { data } = await axios.post('https://ai.lyfeboat.in/api/evaluate-test', {
        answers: questionQueue.map(q => ({
          questionId: q.questionId,
          answer: q.answer ?? ''
        })),
        candidateContext: candidate?.name ?? ''
      });

      const totalScore = data.totalScore ?? (data as { score: number }[]).reduce((sum, e) => sum + (e.score ?? 0), 0);
      const finalSummary = data.summary ?? 'No summary available';

      setScore(totalScore);
      dispatch(updateCandidateProfile({ id: currentId, data: { score: totalScore, testCompleted: true , summary: finalSummary } }));
      message.success(`Test completed! Score: ${totalScore}`);
      setTestStarted(false);
      setQuestionQueue([]);
      setCurrentQuestionIndex(0);
      setTimer(0);
      setChatInput('');
      localStorage.removeItem('interviewState');
      setCurrentId((prev) => prev ? prev + '_updated' : null);

    } catch (err) {
      console.error(err);
      message.error('Failed to evaluate test.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = (id: string) => {
    if (currentId === id) setCurrentId(null);
    dispatch(deleteCandidate(id));
    setTestStarted(false);
    setQuestionQueue([]);
    setCurrentQuestionIndex(0);
    setTimer(0);
    setScore(0);
    localStorage.removeItem('interviewState');
  };

  return (
    <>
      <Loader visible={loading} />
      <Modal
        open={showResumeModal}
        title="Welcome Back!"
        onCancel={() => setShowResumeModal(false)}
        footer={[
          <Button key="resume" type="primary" onClick={resumeTest}>Resume Test</Button>
        ]}
      >
        <Typography.Paragraph>
          You have a paused test. Click resume to continue.
        </Typography.Paragraph>
      </Modal>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, padding: 16 }}>
        <Card style={{ flex: 1, width: isMobile ? '100%' : '30%', marginBottom: isMobile ? 16 : 0, borderRadius: 8 }}>
          <Typography.Title level={4}>Upload Resume</Typography.Title>
          <Upload beforeUpload={(file) => { handleResume(file as File); return false; }} maxCount={1} accept=".pdf,.docx" showUploadList={false}>
            <Button icon={<UploadOutlined />}>Upload PDF / DOCX</Button>
          </Upload>

          <Typography.Title level={5} style={{ marginTop: 16 }}>Candidates</Typography.Title>
          <List
            dataSource={candidates}
            locale={{ emptyText: 'No candidate uploaded' }}
            renderItem={c => (
              <List.Item
                actions={[
                  <Popconfirm title="Delete candidate?" onConfirm={() => handleDeleteCandidate(c.id)} okText="Yes" cancelText="No">
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={c.name ?? 'Unnamed Candidate'}
                  description={
                    <>
                      <div><strong>Email:</strong> {c.email ?? 'N/A'}</div>
                      <div><strong>Phone:</strong> {c.phone ?? 'N/A'}</div>
                      <div><strong>Resume:</strong> {c.resumeFileName ?? 'N/A'}</div>
                      {c.score !== undefined && <div><strong>Score:</strong> {c.score}</div>}
                      {c.summary && <div><strong>Summary:</strong> {c.summary}</div>}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        <Card style={{ flex: 2, width: isMobile ? '100%' : '70%', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', borderRadius: 8, minHeight: 300, padding: 16 }}>
          <Typography.Title level={4}>Chat Bot</Typography.Title>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            minHeight: 200,
            display: !candidate || (!candidate.chat.length && !testStarted) ? 'flex' : 'block',
            justifyContent: !candidate || (!candidate.chat.length && !testStarted) ? 'center' : 'flex-start',
            alignItems: !candidate || (!candidate.chat.length && !testStarted) ? 'center' : 'flex-start',
            textAlign: !candidate || (!candidate.chat.length && !testStarted) ? 'center' : 'left',
            color: '#555',
            backgroundColor: !candidate || (!candidate.chat.length && !testStarted) ? '#fafafa' : 'transparent',
            borderRadius: 8
          }}>
            {!candidate || (!candidate.chat.length && !testStarted) ? (
              <div>
                <Typography.Title level={5}>Welcome Back!</Typography.Title>
                <Typography.Paragraph>
                  Upload your resume to start your AI interview.
                </Typography.Paragraph>
              </div>
            ) : (
              candidate.chat.map(msg => (
                <div key={msg.id} style={{ marginBottom: 8, textAlign: msg.role === 'ai' ? 'left' : 'right' }}>
                  <strong>{msg.role === 'ai' ? 'Bot' : 'You'}:</strong> {msg.text}
                </div>
              ))
            )}
          </div>

          {!testStarted && candidate && !nextField && !candidate.testCompleted && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <Button type="primary" onClick={startTest}>Start Test</Button>
            </div>
          )}

          {(nextField || (testStarted && currentQuestionIndex < questionQueue.length)) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={nextField ? `Enter your ${nextField}...` : 'Type your answer...'}
                onPressEnter={handleSendMessage}
              />
              <Button type="primary" onClick={handleSendMessage}>Send</Button>
            </div>
          )}

          {testStarted && currentQuestionIndex < questionQueue.length && (
            <div style={{ marginTop: 8 }}>
              <Typography.Text type="secondary">Timer: {timer}s</Typography.Text>
              {!paused ? (
                <Button style={{ marginLeft: 16 }} onClick={pauseTest}>Pause Test</Button>
              ) : (
                <Button style={{ marginLeft: 16 }} type="primary" onClick={resumeTest}>Resume Test</Button>
              )}
            </div>
          )}

        </Card>
      </div>
    </>
  );
}
