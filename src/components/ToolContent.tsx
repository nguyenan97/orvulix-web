import React, { ReactNode, useContext, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { Formik, FormikValues, useFormikContext } from 'formik';
import ToolOptions, { GetGroupsType } from '@components/options/ToolOptions';
import ToolInputAndResult from '@components/ToolInputAndResult';
import ToolInfo from '@components/ToolInfo';
import Separator from '@components/Separator';
import ToolExamples, {
  CardExampleType
} from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { CustomSnackBarContext } from '../contexts/CustomSnackBarContext';

const FormikListenerComponent = <T,>({
  input,
  compute,
  onValuesChange
}: {
  input: any;
  compute: (optionsValues: T, input: any) => unknown;
  onValuesChange?: (values: T) => void;
}) => {
  const { values } = useFormikContext<T>();
  const { showSnackBar } = useContext(CustomSnackBarContext);
  const computeRef = useRef(compute);
  useEffect(() => {
    computeRef.current = compute;
  }, [compute]);

  React.useEffect(() => {
    let current = true;
    const report = (exception: unknown) => {
      if (current)
        showSnackBar(
          exception instanceof Error
            ? exception.message
            : 'Tool processing failed.',
          'error'
        );
    };
    try {
      Promise.resolve(computeRef.current(values, input)).catch(report);
    } catch (exception: unknown) {
      report(exception);
    }
    return () => {
      current = false;
    };
  }, [values, input, showSnackBar]);

  useEffect(() => {
    onValuesChange?.(values);
  }, [onValuesChange, values]);
  return null; // This component doesn't render anything
};

interface ToolContentProps<Options, Input> extends ToolComponentProps {
  inputComponent?: ReactNode;
  resultComponent?: ReactNode;
  renderCustomInput?: (
    values: Options,
    setFieldValue: (fieldName: string, value: any) => void
  ) => ReactNode;
  initialValues: Options;
  /**
   * should return non-empty array or null
   */
  getGroups: GetGroupsType<Options> | null;
  /** Returned promises are observed; returned values are otherwise ignored. */
  compute: (optionsValues: Options, input: Input) => unknown;
  toolInfo?: {
    title: string;
    description?: string;
  };
  input?: Input;
  exampleCards?: CardExampleType<Options>[];
  setInput?: React.Dispatch<React.SetStateAction<Input>>;
  validationSchema?: any;
  onValuesChange?: (values: Options) => void;
  verticalGroups?: boolean;
}

export default function ToolContent<T extends FormikValues, I>({
  title,
  inputComponent,
  resultComponent,
  initialValues,
  getGroups,
  compute,
  toolInfo,
  exampleCards,
  input,
  setInput,
  validationSchema,
  renderCustomInput,
  onValuesChange,
  verticalGroups
}: ToolContentProps<T, I>) {
  return (
    <Box>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={() => {}}
      >
        {({ values, setFieldValue }) => {
          return (
            <>
              <ToolInputAndResult
                input={
                  inputComponent ??
                  (renderCustomInput &&
                    renderCustomInput(values, setFieldValue))
                }
                result={resultComponent}
              />
              <FormikListenerComponent<T>
                compute={compute}
                input={input}
                onValuesChange={onValuesChange}
              />
              <ToolOptions getGroups={getGroups} vertical={verticalGroups} />

              {toolInfo && toolInfo.title && toolInfo.description && (
                <ToolInfo
                  title={toolInfo.title}
                  description={toolInfo.description}
                />
              )}

              {exampleCards && exampleCards.length > 0 && (
                <>
                  <Separator backgroundColor="#5581b5" margin="50px" />
                  <ToolExamples
                    title={title}
                    exampleCards={exampleCards}
                    getGroups={getGroups}
                    setInput={setInput}
                  />
                </>
              )}
            </>
          );
        }}
      </Formik>
    </Box>
  );
}
