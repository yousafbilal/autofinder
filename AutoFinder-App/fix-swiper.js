/**
 * Fix react-native-swiper: replace JSX in src/index.js with React.createElement
 * so Android/Metro (TS parser) does not fail.
 */
const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'node_modules', 'react-native-swiper', 'src', 'index.js');

try {
  if (!fs.existsSync(targetPath)) return;
  let content = fs.readFileSync(targetPath, 'utf8');
  if (!content.includes('<View') && !content.includes('<Text')) return;

  const replacements = [
    [
      `    const ActiveDot = this.props.activeDot || (
      <View
        style={[
          {
            backgroundColor: this.props.activeDotColor || '#007aff',
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: 3,
            marginRight: 3,
            marginTop: 3,
            marginBottom: 3
          },
          this.props.activeDotStyle
        ]}
      />
    )
    const Dot = this.props.dot || (
      <View
        style={[
          {
            backgroundColor: this.props.dotColor || 'rgba(0,0,0,.2)',
            width: 8,
            height: 8,
            borderRadius: 4,
            marginLeft: 3,
            marginRight: 3,
            marginTop: 3,
            marginBottom: 3
          },
          this.props.dotStyle
        ]}
      />
    )`,
      `    const activeDotStyle = [
      {
        backgroundColor: this.props.activeDotColor || '#007aff',
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 3,
        marginRight: 3,
        marginTop: 3,
        marginBottom: 3
      },
      this.props.activeDotStyle
    ]
    const ActiveDot = this.props.activeDot || React.createElement(View, { style: activeDotStyle })
    const dotStyle = [
      {
        backgroundColor: this.props.dotColor || 'rgba(0,0,0,.2)',
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 3,
        marginRight: 3,
        marginTop: 3,
        marginBottom: 3
      },
      this.props.dotStyle
    ]
    const Dot = this.props.dot || React.createElement(View, { style: dotStyle })`
    ],
    [
      `    return (
      <View
        pointerEvents="none"
        style={[
          styles['pagination_' + this.state.dir],
          this.props.paginationStyle
        ]}
      >
        {dots}
      </View>
    )
  }

  renderTitle = () => {
    const child = this.state.children[this.state.index]
    const title = child && child.props && child.props.title
    return title ? (
      <View style={styles.title}>
        {this.state.children[this.state.index].props.title}
      </View>
    ) : null
  }`,
      `    return React.createElement(View, {
      pointerEvents: 'none',
      style: [styles['pagination_' + this.state.dir], this.props.paginationStyle]
    }, dots)
  }

  renderTitle = () => {
    const child = this.state.children[this.state.index]
    const title = child && child.props && child.props.title
    return title ? React.createElement(View, { style: styles.title }, this.state.children[this.state.index].props.title) : null
  }`
    ],
    [
      `    if (this.props.loop || this.state.index !== this.state.total - 1) {
      button = this.props.nextButton || <Text style={styles.buttonText}>›</Text>
    }

    return (
      <TouchableOpacity
        onPress={() => button !== null && this.scrollBy(1)}
        disabled={this.props.disableNextButton}
      >
        <View>{button}</View>
      </TouchableOpacity>
    )
  }

  renderPrevButton = () => {`,
      `    if (this.props.loop || this.state.index !== this.state.total - 1) {
      button = this.props.nextButton || React.createElement(Text, { style: styles.buttonText }, '›')
    }

    return React.createElement(TouchableOpacity, {
      onPress: () => button !== null && this.scrollBy(1),
      disabled: this.props.disableNextButton
    }, React.createElement(View, null, button))
  }

  renderPrevButton = () => {`
    ],
    [
      `    if (this.props.loop || this.state.index !== 0) {
      button = this.props.prevButton || <Text style={styles.buttonText}>‹</Text>
    }

    return (
      <TouchableOpacity
        onPress={() => button !== null && this.scrollBy(-1)}
        disabled={this.props.disablePrevButton}
      >
        <View>{button}</View>
      </TouchableOpacity>
    )
  }

  renderButtons = () => {`,
      `    if (this.props.loop || this.state.index !== 0) {
      button = this.props.prevButton || React.createElement(Text, { style: styles.buttonText }, '‹')
    }

    return React.createElement(TouchableOpacity, {
      onPress: () => button !== null && this.scrollBy(-1),
      disabled: this.props.disablePrevButton
    }, React.createElement(View, null, button))
  }

  renderButtons = () => {`
    ],
    [
      `  renderButtons = () => {
    return (
      <View
        pointerEvents="box-none"
        style={[
          styles.buttonWrapper,
          {
            width: this.state.width,
            height: this.state.height
          },
          this.props.buttonWrapperStyle
        ]}
      >
        {this.renderPrevButton()}
        {this.renderNextButton()}
      </View>
    )
  }`,
      `  renderButtons = () => {
    return React.createElement(View, {
      pointerEvents: 'box-none',
      style: [styles.buttonWrapper, { width: this.state.width, height: this.state.height }, this.props.buttonWrapperStyle]
    }, this.renderPrevButton(), this.renderNextButton())
  }`
    ],
    [
      `  renderScrollView = pages => {
    return (
      <ScrollView
        ref={this.refScrollView}
        {...this.props}
        {...this.scrollViewPropOverrides()}
        contentContainerStyle={[styles.wrapperIOS, this.props.style]}
        contentOffset={this.state.offset}
        onScrollBeginDrag={this.onScrollBegin}
        onMomentumScrollEnd={this.onScrollEnd}
        onScrollEndDrag={this.onScrollEndDrag}
        style={this.props.scrollViewStyle}
      >
        {pages}
      </ScrollView>
    )
  }`,
      `  renderScrollView = pages => {
    return React.createElement(ScrollView, {
      ref: this.refScrollView,
      ...this.props,
      ...this.scrollViewPropOverrides(),
      contentContainerStyle: [styles.wrapperIOS, this.props.style],
      contentOffset: this.state.offset,
      onScrollBeginDrag: this.onScrollBegin,
      onMomentumScrollEnd: this.onScrollEnd,
      onScrollEndDrag: this.onScrollEndDrag,
      style: this.props.scrollViewStyle
    }, pages)
  }`
    ],
    [
      `          ) {
            return (
              <View style={pageStyle} key={i}>
                {children[page]}
              </View>
            )
          } else {
            return (
              <View style={pageStyleLoading} key={i}>
                {loadMinimalLoader ? loadMinimalLoader : <ActivityIndicator />}
              </View>
            )
          }
        } else {
          return (
            <View style={pageStyle} key={i}>
              {children[page]}
            </View>
          )
        }
      })
    } else {
      pages = (
        <View style={pageStyle} key={0}>
          {children}
        </View>
      )
    }

    return (
      <View style={[styles.container, containerStyle]} onLayout={this.onLayout}>
        {this.renderScrollView(pages)}
        {showsPagination &&
          (renderPagination
            ? renderPagination(index, total, this)
            : this.renderPagination())}
        {this.renderTitle()}
        {showsButtons && this.renderButtons()}
      </View>
    )
  }
}`,
      `          ) {
            return React.createElement(View, { style: pageStyle, key: i }, children[page])
          } else {
            return React.createElement(View, { style: pageStyleLoading, key: i }, loadMinimalLoader ? loadMinimalLoader : React.createElement(ActivityIndicator, null))
          }
        } else {
          return React.createElement(View, { style: pageStyle, key: i }, children[page])
        }
      })
    } else {
      pages = React.createElement(View, { style: pageStyle, key: 0 }, children)
    }

    return React.createElement(View, {
      style: [styles.container, containerStyle],
      onLayout: this.onLayout
    }, this.renderScrollView(pages), showsPagination && (renderPagination ? renderPagination(index, total, this) : this.renderPagination()), this.renderTitle(), showsButtons && this.renderButtons())
  }
}`
    ],
  ];

  for (const [from, to] of replacements) {
    if (content.includes(from)) content = content.replace(from, to);
  }
  if (content.includes('<View') || content.includes('<Text') || content.includes('<ScrollView') || content.includes('<ActivityIndicator')) return;
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('fix-swiper: Patched react-native-swiper index.js for Android bundling.');
} catch (err) {
  console.warn('fix-swiper:', err.message);
}
