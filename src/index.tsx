import {
  Context,
  Dispatcher,
  Payload,
  Store,
  UseCase,
  StoreGroup
} from "almin";
import * as React from "react";
import * as ReactDOM from "react-dom";

const IncrementPayload: Payload = {
  type: "INCREMENT"
};

const DecrementPayload: Payload = {
  type: "DECREMENT"
};

class CounterState {
  count: number;

  constructor({ count }: { count: number }) {
    this.count = count;
  }

  reduce(payload: Payload): CounterState {
    switch (payload.type) {
      case IncrementPayload.type: {
        return new CounterState({ count: this.count + 1 });
      }
      case DecrementPayload.type: {
        return new CounterState({ count: this.count - 1 });
      }
      default: {
        return this;
      }
    }
  }
}

class CounterStore extends Store<CounterState> {
  constructor() {
    super();
    this.state = new CounterState({ count: 0 });
  }

  receivePayload(payload: Payload): void {
    this.setState(this.state.reduce(payload));
  }

  getState(): CounterState {
    return this.state;
  }
}

const IncrementalCounterUseCase = new class extends UseCase {
  execute() {
    this.dispatch(IncrementPayload);
  }
}();

const DecrementalCounterUseCase = new class extends UseCase {
  execute(count: number) {
    if (count > 0) this.dispatch(DecrementPayload);
  }
}();

const dispatcher = new Dispatcher();
const counterStore = new CounterStore();
const storeGroup = new StoreGroup({ counter: counterStore });
const appContext = new Context({
  dispatcher,
  store: storeGroup,
  options: {
    strict: true
  }
});

interface AppProps {
  appContext: typeof appContext;
}

class App extends React.Component<
  AppProps,
  ReturnType<typeof appContext.getState>
> {
  unSubscribe: any;

  constructor(props: AppProps) {
    super(props);
    this.state = props.appContext.getState();
  }

  componentDidMount() {
    const appContext = this.props.appContext;
    const onChangeHandler = () => {
      this.setState(appContext.getState());
    };
    this.unSubscribe = appContext.onChange(onChangeHandler);
  }

  componentWillUnmount() {
    if (typeof this.unSubscribe === "function") {
      this.unSubscribe();
    }
  }

  render() {
    const counterState = this.state.counter;
    return (
      <Counter counterState={counterState} appContext={this.props.appContext} />
    );
  }
}

interface CounterProps {
  appContext: typeof appContext;
  counterState: CounterState;
}

const Counter = (props: CounterProps) => {
  const incrementCounter = () => {
    props.appContext.useCase(IncrementalCounterUseCase).execute();
  };
  const decrementCounter = () => {
    props.appContext
      .useCase(DecrementalCounterUseCase)
      .execute(props.appContext.getState().counter.count);
  };
  return (
    <div>
      <button onClick={incrementCounter}>Increment!</button>
      <button onClick={decrementCounter}>Decrement!</button>
      <p>Count: {props.counterState.count}</p>
    </div>
  );
};

ReactDOM.render(
  <App appContext={appContext} />,
  document.getElementById("app")
);
