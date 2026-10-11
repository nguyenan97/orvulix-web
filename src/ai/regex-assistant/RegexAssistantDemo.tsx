import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { Link } from 'react-router-dom';
import { REGEX_HEADING, REGEX_INTRO } from './copy';
import { REGEX_SAMPLES, sampleExplanation } from './samples';
import { REGEX_LIMITS, type RegexResult } from './engine';
import { runRegex } from './runner';

export default function RegexAssistantDemo() {
  const [pattern, setPattern] = useState<string>(REGEX_SAMPLES[0].pattern);
  const [flags, setFlags] = useState<string>(REGEX_SAMPLES[0].flags);
  const [text, setText] = useState<string>(REGEX_SAMPLES[0].text);
  const [consent, setConsent] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [result, setResult] = useState<RegexResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  const reset = () => {
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
    setResult(null);
    setError('');
    setExplanation('');
    setConsent(false);
  };
  const run = async () => {
    if (!consent || busy) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const value = await runRegex({ pattern, flags, text }, controller.signal);
      if (!controller.signal.aborted) setResult(value);
    } catch (reason) {
      if (!controller.signal.aborted) setError((reason as Error).message);
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  };
  const explain = () => {
    if (!consent) return;
    const authored = sampleExplanation(pattern, flags, text);
    setError(
      authored
        ? ''
        : 'No authored explanation matches this input. Load a sample, or test your custom regex locally.'
    );
    setExplanation(authored ?? '');
  };
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h3" fontWeight={800}>
            {REGEX_HEADING}
          </Typography>
          <Typography sx={{ mt: 2 }}>{REGEX_INTRO}</Typography>
        </Box>
        <Alert severity="info">
          Demo with authored suggestions and explanations - not AI-generated. No
          Claude API, API key or paid inference. Pattern and text stay in page
          memory and a local worker; this demo does not upload them or save them
          to browser storage.
        </Alert>
        <Typography>
          Load a suggested example, edit its pattern or text, and verify the
          matches. Custom expressions receive real local test results; only
          unchanged samples receive authored explanations. Match results do not
          establish business correctness.
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap">
          {REGEX_SAMPLES.map((sample) => (
            <Button
              key={sample.id}
              variant="outlined"
              onClick={() => {
                reset();
                setPattern(sample.pattern);
                setFlags(sample.flags);
                setText(sample.text);
              }}
            >
              Load {sample.label}
            </Button>
          ))}
          <Button
            onClick={() => {
              reset();
              setPattern('');
              setFlags('g');
              setText('');
            }}
          >
            Clear input
          </Button>
        </Stack>
        <TextField
          label="Regex pattern"
          value={pattern}
          onChange={(event) => {
            reset();
            setPattern(event.target.value);
          }}
          helperText="Pattern only, without / delimiters. Maximum 2 KiB."
          fullWidth
        />
        <TextField
          label="Regex flags"
          value={flags}
          onChange={(event) => {
            reset();
            setFlags(event.target.value);
          }}
          helperText="JavaScript flags: d g i m s u v y. Browser support varies. Without g or y only the first match is returned."
        />
        <TextField
          label="Test text"
          value={text}
          onChange={(event) => {
            reset();
            setText(event.target.value);
          }}
          multiline
          rows={7}
          helperText="Maximum 16 KiB. Use sample data; do not paste secrets."
          fullWidth
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={consent}
              onChange={(event) => {
                if (!event.target.checked) reset();
                else setConsent(true);
              }}
            />
          }
          label="I understand this is a local demo with authored examples, not Claude, and agree to test this input locally."
        />
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button
            variant="contained"
            disabled={!consent || busy}
            onClick={() => void run()}
          >
            Test regex locally
          </Button>
          <Button
            variant="outlined"
            disabled={!consent || busy}
            onClick={explain}
          >
            Show sample explanation
          </Button>
          <Button disabled={!busy} onClick={reset}>
            Cancel test
          </Button>
        </Stack>
        {busy && (
          <Typography role="status">Testing in the local worker…</Typography>
        )}
        {error && (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        )}
        {explanation && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography component="h2" variant="h5">
              Authored sample explanation - not generated by Claude
            </Typography>
            <Typography sx={{ mt: 1 }}>{explanation}</Typography>
          </Paper>
        )}
        {result && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography component="h2" variant="h5">
                Local match results
              </Typography>
              <Typography role="status">
                {result.matches.length} {result.truncated ? 'or more ' : ''}
                match(es) found.
              </Typography>
              {result.truncated && (
                <Alert severity="warning">
                  Results stop at the first {REGEX_LIMITS.matches} matches.
                </Alert>
              )}
              <Typography variant="body2">
                Ranges are zero-based UTF-16 offsets [start, end). Up to 20
                numbered and named captures and 256 characters per preview are
                shown. Null means an unmatched optional capture. Empty matches
                are explicitly labelled.
              </Typography>
              <Box component="ol" sx={{ pl: 3, m: 0 }}>
                {result.matches.map((match, index) => (
                  <Box
                    component="li"
                    key={index}
                    sx={{ mb: 2, overflowWrap: 'anywhere' }}
                  >
                    <Typography component="code">
                      [{match.start}, {match.end}):{' '}
                      {match.start === match.end
                        ? '(empty match)'
                        : JSON.stringify(
                            text
                              .slice(match.start, match.end)
                              .slice(0, REGEX_LIMITS.preview)
                          )}
                    </Typography>
                    {match.captures.length > 0 && (
                      <Typography>
                        Captures: {JSON.stringify(match.captures)}
                      </Typography>
                    )}
                    {match.groups.length > 0 && (
                      <Typography>
                        Named captures:{' '}
                        {JSON.stringify(Object.fromEntries(match.groups))}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Stack>
          </Paper>
        )}
        <Typography variant="body2">
          Each test uses a disposable worker with a 1-second deadline, including
          worker startup. Completion, cancellation, input edits and errors
          terminate the worker. This does not prove an expression is safe for
          production. A future Claude connection would need separate
          data-sharing consent and server-held credentials.
        </Typography>
        <Stack direction="row" gap={2} flexWrap="wrap">
          <MuiLink component={Link} to="/json-assistant">
            JSON Assistant demo
          </MuiLink>
          <MuiLink component={Link} to="/roadmap">
            Product roadmap
          </MuiLink>
          <MuiLink component={Link} to="/privacy">
            Privacy policy
          </MuiLink>
        </Stack>
      </Stack>
    </Container>
  );
}
